""
Forecast endpoints
"""
from fastapi import APIRouter, HTTPException, Path, Query

from app.models.schemas import PredictionResponse, AQIForecast
from app.services.data_service import data_service
from app.services.prediction_service import prediction_service

router = APIRouter()

@router.get("/{location_id}", response_model=PredictionResponse)
async def get_forecast(
    location_id: str = Path(..., description="Station location ID"),
    hours: int = Query(24, ge=1, le=168, description="Forecast hours (1-168)"),
    model_type: str = Query("individual", description="Model type to use")
):
    """Get AQI forecast for a specific station."""
    try:
        # Check if station exists
        station_info = data_service.get_station_info(location_id)
        
        # Get station data
        if location_id not in data_service.station_data:
            raise HTTPException(status_code=503, detail="Station data not available")
        
        station_data = data_service.station_data[location_id]
        
        # Generate prediction
        prediction = prediction_service.predict_station_aqi(
            location_id, station_data, hours, model_type
        )
        
        # Convert to response format
        forecasts = []
        for pred in prediction['predictions']:
            forecasts.append(AQIForecast(
                datetime=pred['datetime'],
                predicted_aqi=pred['predicted_aqi'],
                aqi_category=pred['aqi_category'],
                confidence_score=pred.get('confidence_score')
            ))
        
        return PredictionResponse(
            location_id=location_id,
            station_name=station_info['station_name'],
            model_type=model_type,
            forecast_hours=hours,
            predictions=forecasts,
            generated_at=prediction['generated_at']
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating forecast: {str(e)}")

@router.get("/all")
async def get_all_forecasts(
    hours: int = Query(24, ge=1, le=168, description="Forecast hours"),
    model_type: str = Query("individual", description="Model type")
):
    """Get forecasts for all stations."""
    try:
        all_predictions = prediction_service.predict_all_stations(
            data_service.station_data, hours
        )
        
        # Convert to API format
        forecasts = []
        for location_id, prediction in all_predictions['predictions'].items():
            station_info = data_service.get_station_info(location_id)
            
            station_forecasts = []
            for pred in prediction['predictions']:
                station_forecasts.append(AQIForecast(
                    datetime=pred['datetime'],
                    predicted_aqi=pred['predicted_aqi'],
                    aqi_category=pred['aqi_category'],
                    confidence_score=pred.get('confidence_score')
                ))
            
            forecasts.append({
                "location_id": location_id,
                "station_name": station_info['station_name'],
                "forecasts": station_forecasts
            })
        
        return {
            "total_stations": all_predictions['total_stations'],
            "forecast_hours": hours,
            "model_type": model_type,
            "generated_at": all_predictions['generated_at'],
            "stations": forecasts
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating forecasts: {str(e)}")
