"""
AirWatch Pro Main Application
FastAPI application entry point
"""

import os
import sys
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Dict, Any

# Add parent directory to path
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from app.config import settings
from app.api.endpoints import aqi as aqi_endpoints
from app.services.prediction_service import prediction_service

# Lifecycle management
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize services
    print("Initializing prediction service...")
    if not prediction_service.initialize():
        print("Warning: Failed to initialize prediction service")
    
    # Load initial data
    print("Loading initial station data...")
    try:
        await prediction_service.get_stations_status()
    except Exception as e:
        print(f"Warning: Failed to load initial station data: {e}")
    
    yield
    
    # Shutdown: Clean up resources
    print("Shutting down...")

# Initialize FastAPI app with lifespan
app = FastAPI(
    title="AirWatch Pro API",
    description="API for AQI prediction and monitoring across stations in Thane-Belapur region",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(aqi_endpoints.router, prefix="/api/aqi", tags=["AQI"])

# Root endpoint
@app.get("/")
async def root() -> Dict[str, Any]:
    """Root endpoint with basic API information."""
    return {
        "service": "AirWatch Pro API",
        "version": "1.0.0",
        "description": "AQI Prediction and Monitoring API",
        "status": "online",
        "endpoints": {
            "docs": "/docs",
            "health": "/api/aqi/health",
            "stations": "/api/aqi/stations",
            "forecast": "/api/aqi/forecast/{station_id}?period=24h|3d|7d"
        }
    }

# Health check endpoint
@app.get("/health")
async def health_check() -> Dict[str, str]:
    """Health check endpoint for load balancers and monitoring."""
    if not prediction_service.is_initialized:
        raise HTTPException(status_code=503, detail="Service not initialized")
    return {"status": "ok"}

# Run the application
if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting AirWatch Pro API Server...")
    print(f"🌍 Server will start at: http://{settings.HOST}:{settings.PORT}")
    print(f"📚 Interactive docs: http://{settings.HOST}:{settings.PORT}/docs")
    print(f"🔧 Health check: http://{settings.HOST}:{settings.PORT}/api/v1/health")
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
