"""
Data service for managing and providing access to AQI data.
"""
import os
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union

class DataService:
    """Service for managing AQI data."""
    
    def __init__(self):
        """Initialize the data service."""
        self.station_data = {}
        self.station_info = {}
        self.data_loaded = False
    
    def load_station_data(self) -> bool:
        """
        Load station data from files.
        
        Returns:
            bool: True if data was loaded successfully, False otherwise
        """
        try:
            # TODO: Implement actual data loading from your data files
            # This is a placeholder implementation
            self.station_info = {
                "station1": {
                    "station_id": "station1",
                    "station_name": "Thane MIDC",
                    "latitude": 19.2183,
                    "longitude": 72.9781,
                    "parameters": ["PM2.5", "PM10", "NO2", "SO2", "CO", "O3"]
                },
                # Add more stations as needed
            }
            
            # Initialize empty DataFrames for station data
            for station_id in self.station_info:
                self.station_data[station_id] = pd.DataFrame()
            
            self.data_loaded = True
            return True
            
        except Exception as e:
            print(f"Error loading station data: {e}")
            return False
    
    def get_station_info(self, location_id: str) -> Dict[str, Any]:
        """
        Get information about a specific station.
        
        Args:
            location_id: The ID of the station
            
        Returns:
            Dict containing station information
            
        Raises:
            ValueError: If station is not found
        """
        if location_id not in self.station_info:
            raise ValueError(f"Station {location_id} not found")
        return self.station_info[location_id]
    
    def get_historical_data(
        self,
        location_id: str,
        start_date: datetime,
        end_date: datetime,
        parameters: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Get historical AQI data for a station.
        
        Args:
            location_id: The ID of the station
            start_date: Start date for the data
            end_date: End date for the data
            parameters: List of parameters to include (None for all)
            
        Returns:
            Dict containing the historical data
        """
        if location_id not in self.station_data:
            raise ValueError(f"No data available for station {location_id}")
        
        # Filter data by date range
        df = self.station_data[location_id]
        mask = (df.index >= start_date) & (df.index <= end_date)
        filtered_df = df.loc[mask]
        
        # Filter by parameters if specified
        if parameters:
            available_params = [p for p in parameters if p in filtered_df.columns]
            filtered_df = filtered_df[available_params]
        
        # Convert to list of records
        data = filtered_df.reset_index().to_dict('records')
        
        return {
            'location_id': location_id,
            'station_name': self.station_info.get(location_id, {}).get('station_name', 'Unknown'),
            'period': {'start': start_date, 'end': end_date},
            'total_records': len(data),
            'data': data
        }
    
    def get_current_aqi_data(self) -> Dict[str, Any]:
        """
        Get current AQI data for all stations.
        
        Returns:
            Dict containing current AQI data for all stations
        """
        stations = []
        
        for location_id, df in self.station_data.items():
            if not df.empty:
                # Get the most recent data point
                latest = df.iloc[-1].to_dict()
                
                # Get station info
                station_info = self.station_info.get(location_id, {})
                
                stations.append({
                    'location_id': location_id,
                    'station_name': station_info.get('station_name', 'Unknown'),
                    'current_aqi': latest.get('aqi'),
                    'aqi_category': self._get_aqi_category(latest.get('aqi')),
                    'parameters': {k: v for k, v in latest.items() if k != 'aqi'},
                    'last_updated': df.index[-1].isoformat(),
                    'coordinates': {
                        'latitude': station_info.get('latitude'),
                        'longitude': station_info.get('longitude')
                    }
                })
        
        return {
            'timestamp': datetime.now().isoformat(),
            'total_stations': len(stations),
            'stations': stations
        }
    
    def _get_aqi_category(self, aqi: Optional[float]) -> str:
        """Convert AQI value to category."""
        if aqi is None:
            return "Unknown"
        
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


# Create a singleton instance
data_service = DataService()
