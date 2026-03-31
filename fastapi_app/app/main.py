from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import endpoints
from app.core.scheduler import start_scheduler, shutdown_scheduler
from app.core.db import engine
from app.models.aqi import Base, Station, Reading, Prediction
from app.models.user import User


def init_db():
    Base.metadata.create_all(bind=engine)
    from app.core.db import SessionLocal
    db = SessionLocal()
    try:
        if db.query(Station).count() == 0:
            default_stations = [
                Station(id=1, name="Kasarvadavali, Thane", lat=19.26777, lon=72.97182),
                Station(id=2, name="Bandra, Mumbai", lat=19.05956, lon=72.82962),
                Station(id=3, name="Andheri, Mumbai", lat=19.1136, lon=72.8697),
                Station(id=4, name="Powai, Mumbai", lat=19.1172, lon=72.9050),
                Station(id=5, name="Dadar, Mumbai", lat=19.0176, lon=72.8422),
                Station(id=6, name="Navi Mumbai", lat=19.0330, lon=73.0297),
                Station(id=7, name="Thane City", lat=19.1860, lon=72.9753),
                Station(id=8, name="Kanjurmarg, Mumbai", lat=19.1285, lon=72.9380),
            ]
            db.add_all(default_stations)
            db.commit()
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
