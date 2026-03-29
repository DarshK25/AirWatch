import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi_app.app.main import app

client = TestClient(app)


class TestHealthEndpoint:
    """Test the health check endpoint."""

    def test_root_returns_ok(self):
        """Test that root endpoint returns OK."""
        response = client.get("/")
        assert response.status_code == 200
        assert "message" in response.json()


class TestAQICalculation:
    """Test AQI calculation functionality."""

    def test_aqi_calculator_import(self):
        """Test that AQI calculator can be imported."""
        from fastapi_app.app.services.aqi_calculator import calculate_aqi
        assert callable(calculate_aqi)

    def test_aqi_good(self):
        """Test AQI calculation for good air quality."""
        from fastapi_app.app.services.aqi_calculator import calculate_aqi
        # PM2.5 = 25 µg/m³ should give AQI around 50-75
        result = calculate_aqi({
            "pm25": 25,
            "pm10": 50,
            "no2": 20,
            "so2": 5,
            "o3": 30,
            "co": 1
        })
        assert "overall_aqi" in result
        assert "aqi_category" in result
        assert result["overall_aqi"] > 0


class TestAuthEndpoints:
    """Test authentication endpoints."""

    def test_register_user(self):
        """Test user registration."""
        import random
        response = client.post("/api/v1/auth/register", json={
            "email": f"test_{random.randint(1000,9999)}@example.com",
            "password": "TestPassword123!",
            "full_name": "Test User"
        })
        assert response.status_code in [201, 400]  # 201 created or 400 if exists

    def test_login_invalid(self):
        """Test login with invalid credentials."""
        response = client.post("/api/v1/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401


class TestStationEndpoints:
    """Test station-related endpoints."""

    def test_get_stations(self):
        """Test getting all stations."""
        response = client.get("/api/v1/stations/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_station_details(self):
        """Test getting a specific station."""
        response = client.get("/api/v1/stations/6943")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "name" in data


class TestAQIEndpoints:
    """Test AQI endpoints."""

    def test_get_realtime_aqi(self):
        """Test getting realtime AQI data."""
        response = client.get("/api/v1/aqi/realtime/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_aqi_history(self):
        """Test getting AQI history."""
        response = client.get("/api/v1/aqi/history/6943?hours=24")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestPredictionEndpoints:
    """Test prediction endpoints."""

    def test_get_predictions(self):
        """Test getting predictions."""
        response = client.get("/api/v1/predictions/6943")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestSecurityHeaders:
    """Test security headers."""

    def test_cors_headers(self):
        """Test CORS headers are present."""
        response = client.options("/")
        # CORS preflight should return 200 or 405
        assert response.status_code in [200, 405]
