from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from app.api import endpoints
from app.core.config import settings
from app.core.scheduler import start_scheduler, shutdown_scheduler
from app.core.db import engine
from app.models.aqi import Base, Station, Reading, Prediction
from app.models.user import User


def init_db():
    from sqlalchemy import inspect, text
    Base.metadata.create_all(bind=engine)
    from app.core.db import SessionLocal
    db = SessionLocal()
    try:
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        print(f"Existing tables: {existing_tables}")
        
        pass # Handled by SQLAlchemy tables creation
        
        if db.query(Station).count() == 0:
            from app.services.ingestion import bulk_ingest_data
            print("Loading real AQI data from CSV (all stations)...")
            bulk_ingest_data(db, limit=6000)
            station_count = db.query(Station).count()
            reading_count = db.query(Reading).count()
            print(f"Loaded {station_count} stations and {reading_count} readings.")
            
        # Ensure a demo user exists so the frontend "Use Mock Data / Demo Login" button works
        if db.query(User).filter(User.email == "demo@example.com").count() == 0:
            from app.core.auth import get_password_hash
            demo_user = User(
                full_name="Demo User",
                email="demo@example.com",
                hashed_password=get_password_hash("password123"),
                user_type="admin",
                location="Headquarters",
                is_active=True,
                is_verified=True,
            )
            db.add(demo_user)
            db.commit()
            print("Seeded demo user: demo@example.com")
            
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(endpoints.router, prefix="/api/v1")

frontend_candidates = [
    Path(__file__).resolve().parents[1] / "static",
    Path(__file__).resolve().parents[2] / "frontend" / "dist",
]
frontend_dist = next((path for path in frontend_candidates if path.exists()), None)

if frontend_dist:
    # Mount the built Vite app after API routes so a single Render service can
    # serve both the frontend SPA and the FastAPI backend.
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")


@app.get("/", include_in_schema=False)
async def root():
    if frontend_dist:
        return FileResponse(frontend_dist / "index.html")
    return JSONResponse({"message": "AirWatch Pro API is running. See /docs for API documentation."})
