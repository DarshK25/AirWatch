""
Current AQI endpoints
"""
from fastapi import APIRouter, HTTPException, Path
from fastapi.responses import JSONResponse

from app.services.realtime_service import realtime_service
from app.services.prediction_service import prediction_service

router = APIRouter()

@router.get("/{location_id}")
async def get_current_aqi(location_id: str = Path(..., description="Station location ID")):
    """Get current AQI for a specific station."""
    try:
        # Try to get real-time data first
        try:
            realtime_station = realtime_service.get_station_data(location_id)
            if realtime_station:
                return {
                    "success": True,
                    "data": realtime_station,
                    "data_source": "realtime_openaq"
                }
        except Exception as e:
            print(f"Real-time service failed for station {location_id}, using fallback: {e}")
        
        # Fallback to prediction service
        current_status = prediction_service.get_current_aqi_status()
        
        # Find the specific station
        for station in current_status['stations']:
            if station['location_id'] == location_id:
                return {
                    "success": True,
                    "data": station,
                    "data_source": "historical_projection"
                }
        
        raise ValueError(f"Station {location_id} not found")
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching current AQI: {str(e)}")
