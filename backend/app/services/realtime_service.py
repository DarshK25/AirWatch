""
Real-time AQI data service using OpenAQ API.
"""
import os
import time
import requests
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

class RealtimeService:
    """Service for fetching real-time AQI data from OpenAQ."""
    
    def __init__(self):
        """Initialize the real-time service."""
        self.base_url = "https://api.openaq.org/v2"
        self.cache = {}
        self.cache_ttl = 300  # 5 minutes cache TTL
        self.station_mapping = {
            # Map your station IDs to OpenAQ location IDs
            # Format: 'your_station_id': 'openaq_location_id'
            'thane_midc': 'thane-midc',
            'rabale': 'rabale',
            'airoli': 'airoli',
            'turbhe': 'turbhe',
            'koparkhairane': 'koparkhairane',
            'vashi': 'vashi'
        }
    
    def get_station_data(self, location_id: str) -> Optional[Dict[str, Any]]:
        """
        Get real-time data for a specific station.
        
        Args:
            location_id: The ID of the station
            
        Returns:
            Dict containing station data or None if not available
        """
        # Check cache first
        cache_key = f"station_{location_id}"
        if cache_key in self.cache and (time.time() - self.cache[cache_key]['timestamp']) < self.cache_ttl:
            return self.cache[cache_key]['data']
        
        try:
            # Map internal station ID to OpenAQ location ID
            openaq_id = self.station_mapping.get(location_id)
            if not openaq_id:
                return None
            
            # Get latest measurements
            url = f"{self.base_url}/latest/{openaq_id}"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if not data.get('results'):
                return None
            
            # Process the measurements
            measurements = {}
            for result in data['results']:
                for measurement in result.get('measurements', []):
                    param = measurement.get('parameter')
                    value = measurement.get('value')
                    unit = measurement.get('unit')
                    
                    if param and value is not None:
                        measurements[f"{param}_{unit}"] = value
            
            if not measurements:
                return None
            
            # Calculate AQI (simplified - use a proper AQI calculation in production)
            aqi = self._calculate_aqi(measurements)
            
            # Prepare response
            station_data = {
                'location_id': location_id,
                'station_name': f"{location_id.replace('_', ' ').title()} Station",
                'current_aqi': aqi,
                'aqi_category': self._get_aqi_category(aqi),
                'parameters': measurements,
                'last_updated': datetime.utcnow().isoformat() + 'Z',
                'source': 'OpenAQ',
                'is_realtime': True
            }
            
            # Cache the result
            self.cache[cache_key] = {
                'data': station_data,
                'timestamp': time.time()
            }
            
            return station_data
            
        except requests.RequestException as e:
            print(f"Error fetching real-time data for {location_id}: {e}")
            return None
    
    def get_all_stations(self) -> Dict[str, Any]:
        """
        Get real-time data for all stations.
        
        Returns:
            Dict containing data for all stations
        """
        # Check cache first
        cache_key = "all_stations"
        if cache_key in self.cache and (time.time() - self.cache[cache_key]['timestamp']) < self.cache_ttl:
            return self.cache[cache_key]['data']
        
        stations = []
        for location_id in self.station_mapping.keys():
            station_data = self.get_station_data(location_id)
            if station_data:
                stations.append(station_data)
        
        result = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'total_stations': len(stations),
            'stations': stations
        }
        
        # Cache the result
        self.cache[cache_key] = {
            'data': result,
            'timestamp': time.time()
        }
        
        return result
    
    def _calculate_aqi(self, measurements: Dict[str, float]) -> float:
        """
        Calculate AQI from measurements.
        This is a simplified implementation - use a proper AQI calculation in production.
        """
        # This is a placeholder implementation
        # In a real application, you would implement the official AQI calculation
        # based on the available measurements (PM2.5, PM10, O3, etc.)
        
        # Try to get PM2.5 first (most important for AQI)
        pm25 = measurements.get('pm25_µg/m³')
        if pm25 is not None:
            # Simplified AQI calculation based on PM2.5
            return min(500, max(0, pm25 * 2.5))
        
        # Fallback to PM10 if PM2.5 is not available
        pm10 = measurements.get('pm10_µg/m³')
        if pm10 is not None:
            return min(500, max(0, pm10 * 1.5))
        
        # If no PM measurements, try other pollutants
        for param, value in measurements.items():
            if 'no2' in param.lower():
                return min(500, max(0, value * 2.0))
            elif 'o3' in param.lower():
                return min(500, max(0, value * 1.8))
            elif 'so2' in param.lower():
                return min(500, max(0, value * 2.2))
            elif 'co' in param.lower():
                return min(500, max(0, value * 10.0))
        
        # Default to moderate AQI if no measurements are available
        return 75.0
    
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


# Create a singleton instance
realtime_service = RealtimeService()
