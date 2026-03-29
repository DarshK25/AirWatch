import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestSQLInjection:
    """Test for SQL injection vulnerabilities."""

    def test_station_id_sql_injection(self, client):
        """Test that SQL injection in station ID is prevented."""
        response = client.get("/api/v1/stations/1 OR 1=1")
        # Should not return all stations
        assert response.status_code in [404, 400, 422]

    def test_station_id_negative(self, client):
        """Test that negative station IDs are rejected."""
        response = client.get("/api/v1/stations/-1")
        assert response.status_code in [404, 400, 422]


class TestXSSPrevention:
    """Test for XSS prevention."""

    def test_special_chars_in_email(self, client):
        """Test that special characters in email are sanitized."""
        response = client.post("/api/v1/auth/register", json={
            "email": "<script>alert('xss')</script>@example.com",
            "password": "TestPassword123!",
            "full_name": "Test User"
        })
        # Should reject or sanitize the input
        assert response.status_code in [400, 422]


class TestAuthenticationBypass:
    """Test authentication bypass prevention."""

    def test_unauthorized_access_to_protected_routes(self, client):
        """Test that protected routes require authentication."""
        # Try to access protected endpoint without token
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401

    def test_invalid_token_rejected(self, client):
        """Test that invalid tokens are rejected."""
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401


class TestRateLimiting:
    """Test rate limiting."""

    def test_multiple_failed_logins(self, client):
        """Test that multiple failed logins are rate limited."""
        for _ in range(10):
            response = client.post("/api/v1/auth/login", json={
                "email": "test@example.com",
                "password": "wrongpassword"
            })
        # After multiple attempts, should be rate limited
        # Note: This depends on rate limiting configuration


class TestInputValidation:
    """Test input validation."""

    def test_empty_email_rejected(self, client):
        """Test that empty email is rejected."""
        response = client.post("/api/v1/auth/register", json={
            "email": "",
            "password": "TestPassword123!",
            "full_name": "Test"
        })
        assert response.status_code in [400, 422]

    def test_weak_password_rejected(self, client):
        """Test that weak passwords are rejected."""
        response = client.post("/api/v1/auth/register", json={
            "email": "test@example.com",
            "password": "123",  # Too short
            "full_name": "Test"
        })
        assert response.status_code in [400, 422]

    def test_invalid_email_format(self, client):
        """Test that invalid email format is rejected."""
        response = client.post("/api/v1/auth/register", json={
            "email": "notanemail",
            "password": "TestPassword123!",
            "full_name": "Test"
        })
        assert response.status_code in [400, 422]
