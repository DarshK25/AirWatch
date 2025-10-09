# AirWatch Pro Backend

Backend service for AirWatch Pro, providing AQI prediction and monitoring capabilities for the Thane-Belapur region.

## Features

- Real-time AQI data from OpenAQ
- 24-hour, 3-day, and 7-day AQI forecasts
- Multiple monitoring station support
- Pollutant level monitoring (PM2.5, PM10, NO2, O3, etc.)
- Historical data access

## Prerequisites

- Python 3.8+
- pip (Python package manager)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd AirWatch/backend
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   Create a `.env` file in the backend directory with the following variables:
   ```
   OPENAQ_API_KEY=your_openaq_api_key
   ```

## Running the Application

1. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload
   ```

2. The API will be available at `http://localhost:8000`

3. Access the interactive API documentation at `http://localhost:8000/docs`

## API Endpoints

- `GET /` - API information and available endpoints
- `GET /health` - Health check
- `GET /api/aqi/health` - Detailed service health
- `GET /api/aqi/stations` - List all monitoring stations
- `GET /api/aqi/stations/{station_id}` - Get station details
- `GET /api/aqi/forecast/{station_id}?period=24h|3d|7d` - Get AQI forecast
- `GET /api/aqi/pollutants/{station_id}` - Get pollutant levels

## Development

### Running Tests

```bash
pytest
```

### Code Formatting

```bash
black .
```

### Linting

```bash
flake8
```

## Deployment

For production deployment, consider using:

1. Gunicorn with Uvicorn workers:
   ```bash
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
   ```

2. Docker:
   ```bash
   docker build -t airwatch-backend .
   docker run -d -p 8000:8000 airwatch-backend
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAQ_API_KEY` | OpenAQ API key | Required |
| `DEBUG` | Enable debug mode | `False` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
