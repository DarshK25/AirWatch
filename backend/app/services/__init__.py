"""
Services for AirWatch Pro
"""

# Import all services here
from .prediction_service import prediction_service
from .data_service import data_service
from .realtime_service import realtime_service

__all__ = ['prediction_service', 'data_service', 'realtime_service']
