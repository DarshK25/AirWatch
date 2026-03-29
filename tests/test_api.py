import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add fastapi_app to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'fastapi_app'))

from app.main import app

client = TestClient(app)


class TestHealthEndpoint:
    """Test the health check endpoint."""

    def test_root_returns_ok(self):
        """Test that root endpoint returns OK."""
        response = client.get("/")
        assert response.status_code == 200
        assert "message" in response.json()


class TestAuthEndpoints:
    """Test authentication endpoints."""

    def test_login_invalid(self):
        """Test login with invalid credentials."""
        response = client.post("/api/v1/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code in [401, 422]


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
        assert "id" in data or "name" in data


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
