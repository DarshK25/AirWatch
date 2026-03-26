# AirWatch Pro

A real-time air quality monitoring and prediction system for industrial corridors using machine learning.

## Project Overview

AirWatch Pro is an integrated system that combines real-time AQI monitoring with predictive analytics to provide comprehensive air quality insights for industrial areas. The system uses real air quality data from monitoring stations in the Thane-Belapur Industrial Corridor and employs machine learning models to forecast AQI values 48 hours in advance.

### Key Features

- Real-time monitoring of air quality parameters (PM2.5, PM10, NO2, SO2, O3, CO, Temperature)
- 48-hour AQI prediction using XGBoost machine learning models
- Interactive dashboard with station details and map visualization
- Historical analytics and trend analysis
- User authentication and authorization
- Real-time alerts and notifications
- CPCB standard AQI calculations

## Technology Stack

### Backend
- **FastAPI** - Modern, fast web framework for building APIs
- **SQLAlchemy** - SQL toolkit and ORM
- **PostgreSQL** - Primary database
- **Pydantic** - Data validation using Python type annotations
- **scikit-learn & XGBoost** - Machine learning models
- **JWT** - Authentication and authorization

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Recharts** - Charting library
- **Axios** - HTTP client
- **React Router** - Client-side routing
- **Framer Motion** - Animation library

## Project Structure

```
AirWatch/
|
├── fastapi_app/                    # Backend FastAPI application
│   ├── app/
│   │   ├── api/                    # API endpoints
│   │   │   └── endpoints.py        # Main API routes
│   │   ├── core/                   # Core configurations
│   │   │   ├── auth.py             # JWT authentication
│   │   │   ├── config.py           # Environment config
│   │   │   └── db.py               # Database connection
│   │   ├── models/                 # SQLAlchemy models
│   │   │   ├── aqi.py              # Station, Reading, Prediction models
│   │   │   └── user.py             # User model
│   │   ├── schemas/                # Pydantic schemas
│   │   │   └── auth.py             # Auth schemas
│   │   └── services/               # Business logic
│   │       ├── aqi_calculator.py   # CPCB AQI calculation
│   │       ├── ingestion.py        # Data ingestion service
│   │       ├── ml_pipeline.py      # ML training pipeline
│   │       ├── ml_feature_store.py # Feature engineering
│   │       └── prediction_service.py # Prediction generation
│   ├── ml_models/                  # Trained ML models (pickle files)
│   ├── ml_data/                    # ML training data
│   ├── all_locations_merged.csv    # Main dataset (99.5MB)
│   ├── requirements.txt            # Python dependencies
│   ├── run.py                      # Application entry point
│   ├── setup_db.py                 # Database initialization
│   └── .env                        # Environment variables (not in git)
│
└── frontend/                       # React frontend application
    ├── public/                     # Static files
    ├── src/
    │   ├── components/             # Reusable UI components
    │   ├── pages/                  # Page components
    │   ├── styles/                 # CSS styles
    │   └── utils/                  # Utility functions
    ├── package.json                # NPM dependencies
    └── .env                        # Frontend environment variables
```

## Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- PostgreSQL 14 or higher

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd AirWatch
```

### 2. Backend Setup

#### Create Virtual Environment

```bash
cd fastapi_app
python -m venv .venv
```

Activate the virtual environment:
- Windows: `.venv\Scripts\activate`
- Linux/Mac: `source .venv/bin/activate`

#### Install Dependencies

```bash
pip install -r requirements.txt
```

#### Configure Environment Variables

Create a `.env` file in the `fastapi_app` directory:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/airwatch_db
JWT_SECRET_KEY=your-secret-key-here-use-openssl-rand-hex-32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
API_HOST=0.0.0.0
API_PORT=8000
```

**Important:** Replace `username`, `password`, and generate a secure JWT secret key using:
```bash
openssl rand -hex 32
```

#### Setup Database

1. Create PostgreSQL database:
   ```bash
   createdb airwatch_db
   ```

2. Initialize database and load data:
   ```bash
   python setup_db.py
   ```

This will:
- Create all required tables (stations, readings, aqi_readings, predictions)
- Load monitoring station data
- Import air quality measurements from CSV
- Calculate AQI values using CPCB standards
- Generate initial ML predictions

#### Create Demo User (Optional)

```bash
python create_demo_user.py
```

#### Start the Backend Server

```bash
python run.py
```

The API will be available at:
- Base URL: `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- Alternative Docs: `http://localhost:8000/redoc`

### 3. Frontend Setup

#### Navigate to Frontend Directory

```bash
cd frontend
```

#### Install Dependencies

```bash
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

#### Start Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Usage

1. Open your browser and navigate to `http://localhost:5173`
2. Register a new account or use demo credentials
3. View the main dashboard with all monitoring stations
4. Click on a station to view detailed real-time data
5. Explore 48-hour AQI predictions
6. Navigate to historical analytics for trend analysis
7. Configure alerts and notifications

## API Endpoints

### Public Endpoints

- `GET /` - API health check
- `POST /api/v1/register` - Register new user
- `POST /api/v1/login` - User login

### Protected Endpoints (Require Authentication)

- `GET /api/v1/stations/` - List all monitoring stations
- `GET /api/v1/aqi/realtime/` - Get real-time AQI data
- `GET /api/v1/predictions/{station_id}` - Get 48-hour predictions
- `POST /api/v1/predictions/trigger` - Trigger prediction job
- `GET /api/v1/me` - Get current user info

For detailed API documentation, see [docs/API.md](docs/API.md) or visit `/docs` endpoint.

## Database Schema

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed schema information.

## Development

### Running Tests

Backend:
```bash
pytest
```

Frontend:
```bash
npm test
```

### Building for Production

Backend (uses uvicorn):
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Frontend:
```bash
npm run build
```

The build output will be in the `dist/` directory.

### Code Quality

Format code:
```bash
# Frontend
npm run format
```

Lint code:
```bash
# Frontend
npm run lint
```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in .env file
- Ensure database exists: `psql -l`

### Port Already in Use
```bash
# Backend (default: 8000)
lsof -ti:8000 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :8000   # Windows

# Frontend (default: 5173)
lsof -ti:5173 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :5173   # Windows
```

### Import Errors
- Ensure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`

### CORS Issues
- Check VITE_API_BASE_URL in frontend .env
- Verify CORS middleware in backend main.py

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Air quality data from Central Pollution Control Board (CPCB)
- Monitoring stations in Thane-Belapur Industrial Corridor
- CPCB Air Quality Index calculation standards