""
Historical data endpoints
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import HistoricalDataRequest, HistoricalDataResponse
from app.services.data_service import data_service

router = APIRouter()

@router.post("/", response_model=HistoricalDataResponse)
async def get_historical_data(request: HistoricalDataRequest):
    """Get historical AQI data for specified period."""
    try:
        if request.location_id:
            # Single station data
            historical_data = data_service.get_historical_data(
                request.location_id, 
                request.start_date, 
                request.end_date, 
                request.parameters
            )
            
            return HistoricalDataResponse(
                location_id=historical_data['location_id'],
                station_name=historical_data['station_name'],
                period=historical_data['period'],
                total_records=historical_data['total_records'],
                data=historical_data['data']
            )
        else:
            # All stations - combine data from all stations
            all_data = []
            total_records = 0
            
            for location_id in data_service.station_info.keys():
                try:
                    station_data = data_service.get_historical_data(
                        location_id, 
                        request.start_date, 
                        request.end_date, 
                        request.parameters
                    )
                    all_data.extend(station_data['data'])
                    total_records += station_data['total_records']
                except Exception as e:
                    print(f"Error getting historical data for {location_id}: {e}")
                    continue
            
            return HistoricalDataResponse(
                location_id="all",
                station_name="All Stations",
                period={"start": request.start_date, "end": request.end_date},
                total_records=total_records,
                data=all_data
            )
            
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving historical data: {str(e)}")
