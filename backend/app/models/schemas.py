"""
Pydantic models for request/response validation
"""
from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

# Request Models
class PredictionRequest(BaseModel):
    model_config = {
        'protected_namespaces': ()
    }
    
    location_id: Union[int, str]
    hours: int = Field(default=24, ge=1, le=168, description="Forecast horizon in hours (1-168)")
    model_type: str = Field(default="ensemble", description="Model type: global, individual, or ensemble")
    include_confidence: bool = Field(default=True, description="Include confidence intervals")


class MultiStationRequest(BaseModel):
    model_config = {
        'protected_namespaces': ()
    }
    
    hours: int = Field(default=24, ge=1, le=168)
    model_type: str = Field(default="ensemble")
    include_confidence: bool = Field(default=True)
    location_ids: Optional[List[Union[int, str]]] = Field(default=None, description="Specific stations, or all if None")


class HistoricalRequest(BaseModel):
    location_id: Union[int, str]
    start_date: str = Field(description="Start date in YYYY-MM-DD format")
    end_date: str = Field(description="End date in YYYY-MM-DD format")
    data_type: str = Field(default="aqi", description="Data type: aqi, pollutants, or both")


class HistoricalDataRequest(HistoricalRequest):
    """Alias for HistoricalRequest for backward compatibility"""
    pass

# Response Models
class PollutantData(BaseModel):
    pm25: Optional[float] = None
    pm10: Optional[float] = None
    no2: Optional[float] = None
    o3: Optional[float] = None
    co: Optional[float] = None
    so2: Optional[float] = None


class MeteorologicalData(BaseModel):
    temperature: Optional[float] = None
    humidity: Optional[float] = None


class StationInfo(BaseModel):
    location_id: str
    name: str
    location: str
    current_aqi: Optional[float] = None
    aqi_category: str = "Unknown"
    last_updated: Optional[str] = None
    status: str = "offline"
    pollutants: Optional[PollutantData] = None
    meteorological: Optional[MeteorologicalData] = None


class AQIForecast(BaseModel):
    datetime: str
    predicted_aqi: float
    aqi_category: str
    confidence_score: Optional[float] = None
    confidence_lower: Optional[float] = None
    confidence_upper: Optional[float] = None


class PredictionResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict] = None
    error: Optional[str] = None


class HistoricalDataResponse(BaseModel):
    location_id: str
    station_name: str
    period: Dict[str, str]
    total_records: int
    data: List[Dict[str, Any]]


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    models_loaded: Dict[str, bool]
    total_stations: int


class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    error: Optional[str] = None
