import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestAQICategories:
    """Test AQI category classification."""

    def test_good_aqi(self):
        """Test that AQI 0-50 is classified as Good."""
        from fastapi_app.app.services.aqi_calculator import get_aqi_category
        assert get_aqi_category(25) == "Good"
        assert get_aqi_category(50) == "Good"

    def test_satisfactory_aqi(self):
        """Test that AQI 51-100 is classified as Satisfactory."""
        from fastapi_app.app.services.aqi_calculator import get_aqi_category
        assert get_aqi_category(75) == "Satisfactory"
        assert get_aqi_category(100) == "Satisfactory"

    def test_moderate_aqi(self):
        """Test that AQI 101-200 is classified as Moderate."""
        from fastapi_app.app.services.aqi_calculator import get_aqi_category
        assert get_aqi_category(150) == "Moderate"
        assert get_aqi_category(200) == "Moderate"

    def test_poor_aqi(self):
        """Test that AQI 201-300 is classified as Poor."""
        from fastapi_app.app.services.aqi_calculator import get_aqi_category
        assert get_aqi_category(250) == "Poor"
        assert get_aqi_category(300) == "Poor"

    def test_very_poor_aqi(self):
        """Test that AQI 301-400 is classified as Very Poor."""
        from fastapi_app.app.services.aqi_calculator import get_aqi_category
        assert get_aqi_category(350) == "Very Poor"
        assert get_aqi_category(400) == "Very Poor"

    def test_severe_aqi(self):
        """Test that AQI above 400 is classified as Severe."""
        from fastapi_app.app.services.aqi_calculator import get_aqi_category
        assert get_aqi_category(450) == "Severe"
        assert get_aqi_category(500) == "Severe"


class TestAQIColors:
    """Test AQI color coding."""

    def test_good_color(self):
        """Test green color for good AQI."""
        from fastapi_app.app.services.aqi_calculator import get_aqi_color
        color = get_aqi_color(25)
        assert color in ["#00e400", "#00b300", "green"]

    def test_moderate_color(self):
        """Test yellow/orange color for moderate AQI."""
        from fastapi_app.app.services.aqi_calculator import get_aqi_color
        color = get_aqi_color(150)
        assert color in ["#ff7e00", "#ff7a00", "orange"]


class TestPollutantValidation:
    """Test pollutant data validation."""

    def test_valid_pollutants(self):
        """Test validation of valid pollutant data."""
        from fastapi_app.app.services.aqi_calculator import validate_pollutants
        data = {"pm25": 25, "pm10": 50}
        assert validate_pollutants(data) == True

    def test_invalid_pollutants(self):
        """Test validation rejects negative values."""
        from fastapi_app.app.services.aqi_calculator import validate_pollutants
        data = {"pm25": -10}  # Negative value
        assert validate_pollutants(data) == False

    def test_missing_pollutants(self):
        """Test validation handles missing pollutants."""
        from fastapi_app.app.services.aqi_calculator import validate_pollutants
        data = {}  # Empty data
        # Should return False or handle gracefully
        result = validate_pollutants(data)
        assert isinstance(result, bool)
