import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture
def sample_pollutants():
    """Sample pollutant data for testing."""
    return {
        "pm25": 35.5,
        "pm10": 75.0,
        "no2": 45.0,
        "so2": 15.0,
        "o3": 60.0,
        "co": 2.0
    }


@pytest.fixture
def bad_pollutants():
    """Sample pollutant data for poor air quality."""
    return {
        "pm25": 150.0,
        "pm10": 250.0,
        "no2": 150.0,
        "so2": 100.0,
        "o3": 180.0,
        "co": 10.0
    }


@pytest.fixture
def good_pollutants():
    """Sample pollutant data for good air quality."""
    return {
        "pm25": 12.0,
        "pm10": 30.0,
        "no2": 15.0,
        "so2": 5.0,
        "o3": 25.0,
        "co": 0.5
    }
