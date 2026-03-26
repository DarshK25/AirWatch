# API Documentation

## Base URL

**Development:** `http://localhost:8000/api/v1`

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Authentication

#### Register User

```http
POST /register
```

**Request Body:**
```json
{
  "username": "string",
  "email": "user@example.com",
  "password": "string"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "username": "string",
  "email": "user@example.com"
}
```

#### Login

```http
POST /login
```

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

#### Get Current User

```http
GET /me
```

**Headers:** Requires authentication

**Response:** `200 OK`
```json
{
  "id": 1,
  "username": "string",
  "email": "user@example.com"
}
```

### Stations

#### List All Stations

```http
GET /stations/
```

**Headers:** Requires authentication

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "CBD Belapur, Belapur - MPCB-3379892",
    "lat": 19.0176,
    "lon": 73.0322
  },
  {
    "id": 2,
    "name": "Kasarvadavali, Thane - MPCB-3379885",
    "lat": 19.2183,
    "lon": 72.9781
  }
]
```

### Air Quality Index

#### Get Real-Time AQI

```http
GET /aqi/realtime/
```

**Headers:** Requires authentication

**Response:** `200 OK`
```json
[
  {
    "station_id": 1,
    "station_name": "CBD Belapur, Belapur - MPCB-3379892",
    "lat": 19.0176,
    "lon": 73.0322,
    "last_updated": "2026-01-26T08:30:00",
    "overall_aqi": 52,
    "aqi_category": "Satisfactory",
    "aqi_color": "#58c758",
    "pollutants": {
      "pm25": {
        "parameter": "pm25",
        "value": 14.47,
        "unit": "µg/m³",
        "ugm3_value": 14.47,
        "sub_index": 52
      },
      "pm10": {
        "parameter": "pm10",
        "value": 30.96,
        "unit": "µg/m³",
        "ugm3_value": 30.96,
        "sub_index": 31
      },
      "no2": {
        "parameter": "no2",
        "value": 15.24,
        "unit": "ppb",
        "ugm3_value": 28.56,
        "sub_index": 24
      },
      "so2": {
        "parameter": "so2",
        "value": 8.12,
        "unit": "ppb",
        "ugm3_value": 21.28,
        "sub_index": 18
      },
      "o3": {
        "parameter": "o3",
        "value": 35.6,
        "unit": "ppb",
        "ugm3_value": 70.08,
        "sub_index": 42
      },
      "co": {
        "parameter": "co",
        "value": 650.0,
        "unit": "ppb",
        "ugm3_value": 0.745,
        "sub_index": 25
      }
    }
  }
]
```

**AQI Categories:**
- 0-50: Good (Green)
- 51-100: Satisfactory (Light Green)
- 101-200: Moderate (Yellow)
- 201-300: Poor (Orange)
- 301-400: Very Poor (Red)
- 401-500: Severe (Maroon)

### Predictions

#### Get Station Predictions

```http
GET /predictions/{station_id}
```

**Path Parameters:**
- `station_id` (integer, required): ID of the monitoring station

**Headers:** Requires authentication

**Response:** `200 OK`
```json
[
  {
    "station_id": 1,
    "prediction_time": "2026-01-26T10:00:00",
    "predicted_aqi": 58,
    "model_version": "xgboost_v1"
  },
  {
    "station_id": 1,
    "prediction_time": "2026-01-26T11:00:00",
    "predicted_aqi": 62,
    "model_version": "xgboost_v1"
  }
]
```

Returns 48 hourly predictions.

#### Trigger Prediction Job

```http
POST /predictions/trigger
```

**Headers:** Requires authentication

**Response:** `200 OK`
```json
{
  "message": "Prediction job triggered successfully",
  "predictions_generated": 288
}
```

Manually triggers the ML prediction generation for all stations.

## Error Responses

### 400 Bad Request

```json
{
  "detail": "Invalid request data"
}
```

### 401 Unauthorized

```json
{
  "detail": "Not authenticated"
}
```

### 404 Not Found

```json
{
  "detail": "Resource not found"
}
```

### 422 Validation Error

```json
{
  "detail": [
    {
      "loc": ["body", "username"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### 500 Internal Server Error

```json
{
  "detail": "Internal server error"
}
```

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production use.

## Data Models

### Unit Conversions

The API automatically converts pollutant measurements to standard units (µg/m³):

- **PM2.5, PM10:** Already in µg/m³
- **NO2:** ppb to µg/m³ (multiply by 1.875)
- **SO2:** ppb to µg/m³ (multiply by 2.62)
- **O3:** ppb to µg/m³ (multiply by 1.97)
- **CO:** ppb to mg/m³ (multiply by 0.001146)

### AQI Calculation

AQI is calculated using CPCB (Central Pollution Control Board) standards. The overall AQI is the maximum sub-index among all pollutants.

## Interactive API Documentation

Visit `http://localhost:8000/docs` for interactive Swagger UI documentation where you can test endpoints directly.

Alternative documentation available at `http://localhost:8000/redoc`.
