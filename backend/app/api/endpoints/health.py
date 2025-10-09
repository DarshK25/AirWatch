"""
Health check endpoints
"""
from datetime import datetime
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.models.schemas import HealthResponse
from app.services.prediction_service import prediction_service
from app.services.data_service import data_service

router = APIRouter()

@router.get("/", response_model=HealthResponse)
async def health_check():
    """Health check endpoint. """
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        models_loaded={
            "prediction_service": prediction_service.is_initialized,
            "data_service": len(data_service.station_data) > 0,
            "global_model": prediction_service.global_model is not None,
            "individual_models": prediction_service.individual_models is not None
        },
        total_stations=len(data_service.station_data)
    )
