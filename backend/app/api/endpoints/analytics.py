""
Analytics endpoints
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.services.data_service import data_service
from app.services.prediction_service import prediction_service

router = APIRouter()

@router.get("/summary")
async def get_analytics_summary():
    """Get analytics summary across all stations."""
    try:
        stations_data = data_service.get_current_aqi_data()
        
        # Calculate AQI distribution
        aqi_distribution = {}
        aqi_values = []
        
        for station in stations_data['stations']:
            if station['current_aqi'] is not None:
                aqi_values.append(station['current_aqi'])
                category = station['aqi_category']
                aqi_distribution[category] = aqi_distribution.get(category, 0) + 1
        
        # Calculate data period
        all_dates = []
        for location_id, df in data_service.station_data.items():
            all_dates.extend([df.index.min(), df.index.max()])
        
        summary = {
            "total_stations": stations_data['total_stations'],
            "timestamp": stations_data['timestamp'],
            "data_period": {
                "start": min(all_dates).isoformat() if all_dates else None,
                "end": max(all_dates).isoformat() if all_dates else None
            },
            "current_status": stations_data['stations'],
            "aqi_statistics": {
                "average": sum(aqi_values) / len(aqi_values) if aqi_values else 0,
                "min": min(aqi_values) if aqi_values else 0,
                "max": max(aqi_values) if aqi_values else 0,
                "distribution": aqi_distribution
            },
            "service_status": {
                "prediction_service": prediction_service.is_initialized,
                "models_available": {
                    "global": prediction_service.global_model is not None,
                    "individual": prediction_service.individual_models is not None
                }
            }
        }
        
        return summary
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating analytics summary: {str(e)}")
