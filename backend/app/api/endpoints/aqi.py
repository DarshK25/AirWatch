"""
AQI API endpoints for the AirWatch application.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import pandas as pd

from app.services.prediction_service import prediction_service
from app.models.schemas import (
    AQIForecast,
    PredictionResponse,
    StationInfo,
    HealthResponse,
    ApiResponse
)

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    if not prediction_service.is_initialized:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "models_loaded": {
            "global_model": prediction_service.global_model is not None,
            "individual_models": len(prediction_service.individual_models) > 0,
            "stations_configured": len(prediction_service.station_metadata)
        },
        "total_stations": len(prediction_service.station_metadata)
    }

@router.get("/stations", response_model=List[StationInfo])
async def get_stations():
    """Get list of all monitoring stations."""
    if not prediction_service.is_initialized:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    stations = await prediction_service.get_stations_status()
    return stations

@router.get("/stations/{station_id}", response_model=Dict[str, Any])
async def get_station(station_id: str):
    """Get current AQI data for a specific station."""
    if not prediction_service.is_initialized:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    if station_id not in prediction_service.station_metadata:
        raise HTTPException(status_code=404, detail=f"Station {station_id} not found")
    
    # Get current data
    stations = await prediction_service.get_stations_status()
    station = next((s for s in stations if s['station_id'] == station_id), None)
    
    if not station:
        raise HTTPException(status_code=404, detail=f"Station {station_id} data not available")
    
    return station

@router.get("/predict/{station_id}", response_model=PredictionResponse)
async def predict_aqi(
    station_id: str,
    hours: int = Query(24, ge=1, le=168, description="Forecast horizon in hours (1-168)"),
    model_type: str = Query("ensemble", description="Model type: global, individual, or ensemble")
):
    """Get AQI forecast for a specific station."""
    if not prediction_service.is_initialized:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    if station_id not in prediction_service.station_metadata:
        raise HTTPException(status_code=404, detail=f"Station {station_id} not found")
    
    try:
        prediction = await prediction_service.predict_aqi(station_id, hours, model_type)
        return {
            "success": True,
            "message": f"AQI forecast generated for station {station_id}",
            "data": prediction
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to generate forecast: {str(e)}",
            "error": str(e)
        }

@router.get("/forecast/{station_id}", response_model=Dict[str, Any])
async def get_forecast(
    station_id: str,
    period: str = Query("24h", regex="^(24h|3d|7d)$", description="Forecast period: 24h, 3d, or 7d")
):
    """Get AQI forecast for a specific station with a simplified period parameter."""
    if not prediction_service.is_initialized:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    if station_id not in prediction_service.station_metadata:
        raise HTTPException(status_code=404, detail=f"Station {station_id} not found")
    
    # Map period to hours
    hours_map = {
        "24h": 24,
        "3d": 72,
        "7d": 168
    }
    
    try:
        prediction = await prediction_service.predict_aqi(
            station_id=station_id,
            hours=hours_map[period],
            model_type="ensemble"
        )
        
        # Process forecast into daily buckets for longer periods
        if period in ["3d", "7d"]:
            forecast_data = []
            current_day = None
            daily_entries = []
            
            for entry in prediction["forecast"]:
                dt = datetime.fromisoformat(entry["timestamp"].replace("Z", "+00:00"))
                day = dt.date()
                
                if day != current_day:
                    if current_day is not None:
                        # Calculate stats for the previous day
                        aqis = [e["predicted_aqi"] for e in daily_entries]
                        forecast_data.append({
                            "date": current_day.isoformat(),
                            "avg_aqi": round(sum(aqis) / len(aqis), 1),
                            "min_aqi": min(aqis),
                            "max_aqi": max(aqis),
                            "category": prediction_service._get_aqi_category(sum(aqis) / len(aqis))
                        })
                    
                    current_day = day
                    daily_entries = []
                
                daily_entries.append(entry)
            
            # Add the last day
            if daily_entries:
                aqis = [e["predicted_aqi"] for e in daily_entries]
                forecast_data.append({
                    "date": current_day.isoformat(),
                    "avg_aqi": round(sum(aqis) / len(aqis), 1),
                    "min_aqi": min(aqis),
                    "max_aqi": max(aqis),
                    "category": prediction_service._get_aqi_category(sum(aqis) / len(aqis))
                })
            
            prediction["daily_forecast"] = forecast_data
        
        return {
            "success": True,
            "station_id": station_id,
            "station_name": prediction["station_info"]["name"],
            "current_aqi": prediction["station_info"]["current_aqi"],
            "aqi_category": prediction["station_info"]["aqi_category"],
            "last_updated": prediction["station_info"]["last_updated"],
            "forecast": prediction["forecast"],
            "forecast_period": period,
            "generated_at": prediction["generated_at"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate forecast: {str(e)}")

@router.get("/pollutants/{station_id}", response_model=Dict[str, Any])
async def get_pollutants(station_id: str):
    """Get current pollutant levels for a specific station."""
    if not prediction_service.is_initialized:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    if station_id not in prediction_service.station_metadata:
        raise HTTPException(status_code=404, detail=f"Station {station_id} not found")
    
    stations = await prediction_service.get_stations_status()
    station = next((s for s in stations if s['station_id'] == station_id), None)
    
    if not station or 'pollutants' not in station:
        raise HTTPException(status_code=404, detail=f"Pollutant data not available for station {station_id}")
    
    return {
        "station_id": station_id,
        "station_name": station['station_name'],
        "last_updated": station.get('last_updated'),
        "pollutants": station['pollutants']
    }
