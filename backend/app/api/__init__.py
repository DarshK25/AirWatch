"""API package for AirWatch Pro."""

from fastapi import APIRouter

# Import all endpoint routers here
from .endpoints import health, stations, current, forecast, historical, analytics, aqi

# Create main API router
api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(stations.router, prefix="/stations", tags=["stations"])
api_router.include_router(current.router, prefix="/current", tags=["current"])
api_router.include_router(forecast.router, prefix="/forecast", tags=["forecast"])
api_router.include_router(historical.router, prefix="/historical", tags=["historical"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(aqi.router, prefix="/aqi", tags=["aqi"])
