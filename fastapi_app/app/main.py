from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import endpoints
from app.core.scheduler import start_scheduler, shutdown_scheduler
from app.core.db import engine
from app.models.aqi import Base, Station, Reading, Prediction
from app.models.user import User


def init_db():
    from app.models.user import User
    from sqlalchemy import text
    Base.metadata.create_all(bind=engine)
    from app.core.db import SessionLocal
    db = SessionLocal()
    try:
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        print(f"Existing tables: {existing_tables}")
        
        if 'users' not in existing_tables:
            print("Creating users table...")
            db.execute(text("""
                CREATE TABLE users (
                    id INTEGER NOT NULL PRIMARY KEY,
                    full_name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    hashed_password VARCHAR(255) NOT NULL,
                    user_type VARCHAR(100) NOT NULL,
                    location VARCHAR(255),
                    is_active BOOLEAN DEFAULT 1,
                    is_verified BOOLEAN DEFAULT 0,
                    created_at DATETIME,
                    last_login DATETIME,
                    profile_picture TEXT
                )
            """))
            db.commit()
            print("Users table created.")
        
        if db.query(Station).count() == 0:
            from app.services.ingestion import bulk_ingest_data
            print("Loading real AQI data from CSV...")
            bulk_ingest_data(db, limit=1000)
            station_count = db.query(Station).count()
            reading_count = db.query(Reading).count()
            print(f"Loaded {station_count} stations and {reading_count} readings.")
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Lifespan — runs startup/shutdown logic around the app's lifetime.
# APScheduler starts here so it's alive for the entire app lifetime.
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP: create tables and seed data if needed
    init_db()
    start_scheduler()
    yield
    # SHUTDOWN: stop the scheduler cleanly
    shutdown_scheduler()


# Pass lifespan into FastAPI so it knows to use it
app = FastAPI(
    title="AirWatch Pro - Industrial AQI Prediction API",
    description="Backend for Real-Time AQI Prediction and Monitoring System.",
    version="v1",
    lifespan=lifespan,
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://air-watch-theta.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(endpoints.router, prefix="/api/v1")


@app.get("/", include_in_schema=False)
async def root():
    return {"message": "AirWatch Pro API is running. See /docs for API documentation."}
