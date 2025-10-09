""
Stations endpoints
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.services.realtime_service import realtime_service
from app.services.prediction_service import prediction_service

router = APIRouter()

@router.get("/")
async def get_stations():
    """Get information about all monitoring stations."""
    try:
        # Try to get real-time data first, fallback to prediction service
        try:
            realtime_data = realtime_service.get_all_stations()
            if realtime_data and realtime_data.get('stations'):
                return {
                    "success": True,
                    "data": realtime_data['stations'],
                    "data_source": "realtime_openaq",
                    "timestamp": realtime_data['timestamp']
                }
        except Exception as e:
            print(f"Real-time service failed, using fallback: {e}")
        
        # Fallback to prediction service
        current_status = prediction_service.get_current_aqi_status()
        return {
            "success": True,
            "data": current_status['stations'],
            "data_source": "historical_projection",
            "timestamp": current_status['timestamp']
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stations: {str(e)}")
