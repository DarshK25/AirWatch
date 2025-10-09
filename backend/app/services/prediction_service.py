"""
Prediction service for AQI forecasting with OpenAQ integration.
"""
import os
import json
import joblib
import numpy as np
import pandas as pd
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union, Tuple
from fastapi import HTTPException

# Configuration
OPENAQ_API_KEY = os.getenv("OPENAQ_API_KEY", "35682035d064812a6f2dd0f5c52bfa51f6e0b1226b792022a3377eb18bdf5c1b")
OPENAQ_BASE_URL = "https://api.openaq.org/v2"

# Station metadata (customize based on your locations)
STATION_METADATA = {
    "3409469": {
        "name": "Kasarvadavali, Thane",
        "location": "Kasarvadavali, Thane - MPCB-3379885",
        "lat": 19.26777,
        "lon": 72.97182
    },
    # Add more stations as needed
}

# Mapping of OpenAQ parameters to our standard names
PARAMETER_MAPPING = {
    'pm25': 'PM2.5',
    'pm10': 'PM10',
    'no2': 'NO2',
    'o3': 'O3',
    'so2': 'SO2',
    'co': 'CO'
}

class AQIPredictionService:
    """Service for AQI predictions with OpenAQ integration."""
    
    def __init__(self):
        """Initialize the prediction service."""
        self.global_model = None
        self.individual_models = {}
        self.is_initialized = False
        self.model_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'models')
        self.station_data = {}
        self.last_updated = None
        self.station_metadata = STATION_METADATA
        
        # Initialize models
        self.initialize()
    
    def initialize(self) -> bool:
        """Initialize the prediction service by loading models and station data."""
        try:
            # Ensure models directory exists
            os.makedirs(self.model_dir, exist_ok=True)
            
            # Load global model
            global_model_path = os.path.join(self.model_dir, 'global_model.pkl')
            if os.path.exists(global_model_path):
                self.global_model = joblib.load(global_model_path)
            
            # Load individual models
            if os.path.exists(self.model_dir):
                for filename in os.listdir(self.model_dir):
                    if filename.startswith('model_') and filename.endswith('.pkl'):
                        station_id = filename[6:-4]
                        model_path = os.path.join(self.model_dir, filename)
                        self.individual_models[station_id] = joblib.load(model_path)
            
            # Initialize station data
            self._initialize_station_data()
            
            self.is_initialized = True
            return True
            
        except Exception as e:
            print(f"Error initializing prediction service: {e}")
            self.is_initialized = False
            return False
    
    def _initialize_station_data(self):
        """Initialize station data structure."""
        for station_id, meta in self.station_metadata.items():
            self.station_data[station_id] = {
                'station_id': station_id,
                'station_name': meta['name'],
                'location': meta['location'],
                'lat': meta['lat'],
                'lon': meta['lon'],
                'current_aqi': None,
                'aqi_category': 'Unknown',
                'last_updated': None,
                'pollutants': {param: None for param in PARAMETER_MAPPING.values()}
            }
    
    def predict_station_aqi(
        self,
        location_id: str,
        station_data: pd.DataFrame,
        hours: int = 24,
        model_type: str = 'individual'
    ) -> Dict[str, Any]:
        """
        Predict AQI for a specific station.
        
        Args:
            location_id: ID of the station
            station_data: Historical data for the station
            hours: Number of hours to forecast
            model_type: Type of model to use ('individual' or 'global')
            
        Returns:
            Dict containing predictions and metadata
        """
        try:
            # Select model based on type
            if model_type == 'individual' and location_id in self.individual_models:
                model = self.individual_models[location_id]
                model_source = 'individual'
            elif self.global_model is not None:
                model = self.global_model
                model_source = 'global'
            else:
                raise ValueError("No suitable model available for prediction")
            
            # Prepare features for prediction
            # This is a simplified example - adjust based on your actual model requirements
            features = self._prepare_features(station_data, hours)
            
            # Make predictions
            predictions = []
            current_time = datetime.now()
            
            for i in range(hours):
                # Predict next hour (placeholder implementation)
                # Replace with actual prediction logic
                predicted_aqi = self._predict_next_hour(model, features, i)
                
                # Add to predictions
                prediction_time = current_time + timedelta(hours=i+1)
                predictions.append({
                    'datetime': prediction_time.isoformat(),
                    'predicted_aqi': float(predicted_aqi),
                    'aqi_category': self._get_aqi_category(predicted_aqi),
                    'confidence_score': 0.9  # Placeholder confidence score
                })
            
            return {
                'location_id': location_id,
                'model_type': model_source,
                'forecast_hours': hours,
                'predictions': predictions,
                'generated_at': current_time.isoformat()
            }
            
        except Exception as e:
            raise ValueError(f"Prediction failed: {str(e)}")
    
    def predict_all_stations(
        self,
        all_station_data: Dict[str, pd.DataFrame],
        hours: int = 24
    ) -> Dict[str, Any]:
        """
        Predict AQI for all stations.
        
        Args:
            all_station_data: Dictionary mapping station IDs to their data
            hours: Number of hours to forecast
            
        Returns:
            Dict containing predictions for all stations
        """
        predictions = {}
        current_time = datetime.now()
        
        for location_id, station_data in all_station_data.items():
            try:
                # Try individual model first, fall back to global model
                if location_id in self.individual_models:
                    model = self.individual_models[location_id]
                    model_source = 'individual'
                elif self.global_model is not None:
                    model = self.global_model
                    model_source = 'global'
                else:
                    continue  # Skip if no model is available
                
                # Make predictions for this station
                station_pred = self.predict_station_aqi(
                    location_id, station_data, hours, model_source
                )
                predictions[location_id] = station_pred
                
            except Exception as e:
                print(f"Error predicting for station {location_id}: {e}")
                continue
        
        return {
            'total_stations': len(predictions),
            'forecast_hours': hours,
            'predictions': predictions,
            'generated_at': current_time.isoformat()
        }
    
    def get_current_aqi_status(self) -> Dict[str, Any]:
        """
        Get current AQI status for all stations.
        
        This is a fallback method when real-time data is not available.
        """
        current_time = datetime.now()
        stations = []
        
        for location_id in self.individual_models.keys():
            # Generate a synthetic current AQI based on the model
            # This is a placeholder - replace with actual prediction logic
            current_aqi = self._generate_synthetic_aqi(location_id, current_time)
            
            stations.append({
                'location_id': location_id,
                'station_name': f"Station {location_id}",  # Replace with actual station names
                'current_aqi': current_aqi,
                'aqi_category': self._get_aqi_category(current_aqi),
                'last_updated': current_time.isoformat(),
                'is_prediction': True  # Indicate this is a prediction, not real data
            })
        
        return {
            'timestamp': current_time.isoformat(),
            'total_stations': len(stations),
            'stations': stations
        }
    
    def _prepare_features(self, data: pd.DataFrame, hours: int) -> np.ndarray:
        """
        Prepare features for prediction.
        
        Args:
            data: Historical data for feature engineering
            hours: Number of hours to forecast
            
        Returns:
            Numpy array of features
        """
        # This is a placeholder implementation
        # Replace with your actual feature engineering logic
        if data.empty:
            return np.zeros((hours, 1))
        
        # Simple feature engineering example
        # In a real implementation, you would include more sophisticated features
        features = []
        
        # Use the last 24 hours of data (if available)
        lookback = min(24, len(data))
        recent_data = data.iloc[-lookback:]
        
        # Add rolling statistics as features
        if 'aqi' in recent_data.columns:
            # Simple moving averages
            features.extend([
                recent_data['aqi'].mean(),
                recent_data['aqi'].std(),
                recent_data['aqi'].iloc[-1],  # Most recent value
                recent_data['aqi'].iloc[-1] - recent_data['aqi'].iloc[-2] if len(recent_data) > 1 else 0  # Recent change
            ])
        
        # Add time-based features
        now = pd.Timestamp.now()
        features.extend([
            now.hour / 24.0,  # Time of day (normalized)
            now.dayofweek / 7.0,  # Day of week (normalized)
            now.month / 12.0  # Month (normalized)
        ])
        
        # Repeat features for each prediction hour
        # In a real implementation, you would adjust time-based features for each prediction step
        return np.tile(features, (hours, 1))
    
    def _predict_next_hour(self, model: Any, features: np.ndarray, hour_idx: int) -> float:
        """
        Predict AQI for the next hour.
        
        Args:
            model: The prediction model
            features: Input features
            hour_idx: Index of the prediction hour (0 to hours-1)
            
        Returns:
            Predicted AQI value with confidence interval
        """
        try:
            if hasattr(model, 'predict'):
                # For scikit-learn style models
                prediction = model.predict(features[hour_idx:hour_idx+1])
                
                # Calculate confidence interval (simplified)
                if hasattr(model, 'predict_quantiles'):
                    # For models that support quantile prediction
                    lower = model.predict_quantiles(features[hour_idx:hour_idx+1], quantile=0.1)
                    upper = model.predict_quantiles(features[hour_idx:hour_idx+1], quantile=0.9)
                    confidence = 0.9 - (0.1 * hour_idx / 24)  # Decrease confidence for further predictions
                else:
                    # Default confidence calculation
                    confidence = max(0.7 - (0.02 * hour_idx), 0.3)
                    std_dev = np.std([tree.predict(features[hour_idx:hour_idx+1])[0] 
                                    for tree in model.estimators_]) if hasattr(model, 'estimators_') else 10
                    
                    lower = prediction - (1.96 * std_dev)
                    upper = prediction + (1.96 * std_dev)
                
                return {
                    'predicted_aqi': float(prediction[0]),
                    'confidence_lower': float(lower[0]),
                    'confidence_upper': float(upper[0]),
                    'confidence': float(confidence)
                }
            else:
                # Fallback to simple prediction
                return {
                    'predicted_aqi': 50.0,
                    'confidence_lower': 40.0,
                    'confidence_upper': 60.0,
                    'confidence': 0.5
                }
                
        except Exception as e:
            print(f"Prediction error: {e}")
            return {
                'predicted_aqi': 50.0,
                'confidence_lower': 30.0,
                'confidence_upper': 70.0,
                'confidence': 0.3
            }
    
    def _generate_synthetic_aqi(self, location_id: str, timestamp: datetime) -> float:
        """
        Generate a synthetic AQI value for demonstration purposes.
        
        In a real implementation, this would use actual models and data.
        """
        # Base AQI with some station-specific variation
        base_aqi = 50 + hash(location_id) % 30
        
        # Add time-based variation
        hour = timestamp.hour
        day = timestamp.weekday()
        month = timestamp.month
        
        # Higher AQI during rush hours and weekdays
        time_factor = 1.0
        if 7 <= hour <= 9 or 17 <= hour <= 19:  # Rush hours
            time_factor *= 1.3
        if day < 5:  # Weekdays
            time_factor *= 1.2
        
        # Higher AQI in winter months
        if month in [11, 0, 1]:  # Nov, Dec, Jan
            time_factor *= 1.4
        
        # Add some random variation
        random_factor = 0.9 + 0.2 * np.random.random()
        
        return float(base_aqi * time_factor * random_factor)
    
    @staticmethod
    def _get_aqi_category(aqi: float) -> str:
        """Convert AQI value to category."""
        if aqi <= 50:
            return "Good"
        elif aqi <= 100:
            return "Moderate"
        elif aqi <= 150:
            return "Unhealthy for Sensitive Groups"
        elif aqi <= 200:
            return "Unhealthy"
        elif aqi <= 300:
            return "Very Unhealthy"
        else:
            return "Hazardous"


    # OpenAQ API Methods
    async def fetch_openaq_data(self, location_id: str) -> Optional[Dict]:
        """Fetch latest data from OpenAQ for a specific location."""
        if location_id not in self.station_metadata:
            return None
            
        station = self.station_metadata[location_id]
        headers = {'X-API-Key': OPENAQ_API_KEY}
        
        try:
            # Fetch latest measurements
            params = {
                'location_id': location_id,
                'limit': 10,  # Get last 10 measurements
                'order_by': 'datetime',
                'sort': 'desc'
            }
            
            response = requests.get(
                f"{OPENAQ_BASE_URL}/measurements",
                params=params,
                headers=headers,
                timeout=10
            )
            response.raise_for_status()
            
            data = response.json()
            if not data.get('results'):
                return None
                
            # Process measurements
            measurements = {param: None for param in PARAMETER_MAPPING.values()}
            aqi_values = []
            
            for result in data['results']:
                param = result.get('parameter')
                if param in PARAMETER_MAPPING:
                    std_param = PARAMETER_MAPPING[param]
                    value = result.get('value')
                    if value is not None:
                        measurements[std_param] = float(value)
                        
                        # Simple AQI calculation (replace with proper AQI calculation)
                        if param == 'pm25':
                            aqi = value * 2  # Simplified conversion
                            aqi_values.append(aqi)
            
            # Update station data
            if aqi_values:
                avg_aqi = sum(aqi_values) / len(aqi_values)
                self.station_data[location_id].update({
                    'current_aqi': avg_aqi,
                    'aqi_category': self._get_aqi_category(avg_aqi),
                    'pollutants': measurements,
                    'last_updated': datetime.utcnow().isoformat() + 'Z'
                })
                
                return self.station_data[location_id]
                
        except Exception as e:
            print(f"Error fetching OpenAQ data for {location_id}: {e}")
            
        return None
    
    # Prediction Methods
    async def predict_aqi(
        self, 
        location_id: str, 
        hours: int = 24,
        model_type: str = 'ensemble'
    ) -> Dict:
        """Predict AQI for a specific location."""
        if location_id not in self.station_data:
            raise HTTPException(status_code=404, detail=f"Station {location_id} not found")
            
        # Get current data or fetch from OpenAQ if stale
        current_data = self.station_data[location_id]
        last_updated = current_data.get('last_updated')
        
        if not last_updated or (datetime.utcnow() - datetime.fromisoformat(last_updated.replace('Z', ''))) > timedelta(minutes=30):
            await self.fetch_openaq_data(location_id)
            current_data = self.station_data[location_id]
        
        # Prepare forecast
        forecast = await self._generate_forecast(location_id, hours, model_type)
        
        return {
            'station_info': {
                'station_id': location_id,
                'name': current_data['station_name'],
                'location': current_data['location'],
                'current_aqi': current_data['current_aqi'],
                'aqi_category': current_data['aqi_category'],
                'last_updated': current_data['last_updated']
            },
            'forecast': forecast,
            'forecast_hours': hours,
            'model_type': model_type,
            'generated_at': datetime.utcnow().isoformat() + 'Z'
        }
    
    async def _generate_forecast(
        self, 
        location_id: str, 
        hours: int,
        model_type: str
    ) -> List[Dict]:
        """Generate AQI forecast for a location."""
        # This is a simplified implementation
        # In a real app, you would use your trained models here
        
        current_aqi = self.station_data[location_id].get('current_aqi', 50)
        forecast = []
        
        for i in range(hours):
            # Simulate diurnal pattern
            hour_of_day = (datetime.utcnow().hour + i) % 24
            
            # Base prediction with some randomness
            if 6 <= hour_of_day < 18:  # Daytime
                base_aqi = current_aqi * (1 + 0.1 * np.sin(i/4) + 0.1 * np.random.randn())
            else:  # Nighttime
                base_aqi = current_aqi * (0.9 + 0.05 * np.sin(i/4) + 0.05 * np.random.randn())
            
            # Add some trend
            trend = 0.1 * i / 24  # Small trend over time
            predicted_aqi = max(0, base_aqi * (1 + trend))
            
            forecast.append({
                'timestamp': (datetime.utcnow() + timedelta(hours=i+1)).isoformat() + 'Z',
                'predicted_aqi': round(predicted_aqi, 1),
                'aqi_category': self._get_aqi_category(predicted_aqi),
                'confidence': max(0.7 - (0.01 * i), 0.3)  # Confidence decreases with time
            })
            
        return forecast
    
    def _get_aqi_category(self, aqi: float) -> str:
        """Convert AQI value to category."""
        if aqi <= 50:
            return 'Good'
        elif aqi <= 100:
            return 'Satisfactory'
        elif aqi <= 200:
            return 'Moderate'
        elif aqi <= 300:
            return 'Poor'
        elif aqi <= 400:
            return 'Very Poor'
        else:
            return 'Severe'
    
    async def get_stations_status(self) -> List[Dict]:
        """Get current status of all stations."""
        # Update all stations data
        for location_id in self.station_metadata.keys():
            await self.fetch_openaq_data(location_id)
        
        return list(self.station_data.values())


# Create a singleton instance
prediction_service = AQIPredictionService()
