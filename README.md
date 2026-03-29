# AirWatch Pro

![Air Quality Monitoring](https://img.shields.io/badge/Air%20Quality-Monitoring-blue)
![ML Predictions](https://img.shields.io/badge/ML-Predictions-purple)
![FastAPI](https://img.shields.io/badge/FastAPI-Ready-green)
![React](https://img.shields.io/badge/React-18-blue)

A real-time air quality monitoring and prediction system for industrial corridors using machine learning.

## Key Features

- **Real-time Monitoring** - Live AQI data from 6 monitoring stations
- **48-Hour Predictions** - XGBoost ML model forecasts AQI ahead
- **Interactive Dashboard** - React-based UI with charts and maps
- **Historical Analytics** - Trend analysis and data export
- **Smart Alerts** - Configurable threshold notifications
- **User Authentication** - JWT-based secure access

---

## System Architecture

```mermaid
flowchart TB
    subgraph DataSources["Data Sources"]
        MPCB[MPCB Monitoring Stations]
        OpenAQ[OpenAQ API]
        CSV[Historical CSV Data]
    end

    subgraph Backend["Backend - FastAPI"]
        INGEST[Data Ingestion Service]
        AQI_CALC[AQI Calculator]
        ML_PIPELINE[ML Pipeline]
        PRED_SERVICE[Prediction Service]
        SCHEDULER[APScheduler]
        
        subgraph ML["Machine Learning"]
            FEATURE[Feature Engineering]
            TRAIN[Model Training]
            XGB[XGBoost Model]
        end
    end

    subgraph Database["Database - SQLite"]
        STATIONS[Stations Table]
        READINGS[Readings Table]
        PREDICTIONS[Predictions Table]
        USERS[Users Table]
    end

    subgraph Frontend["Frontend - React"]
        LANDING[Landing Page]
        DASHBOARD[Dashboard]
        STATIONS[Stations Page]
        ANALYTICS[Historical Analytics]
        ALERTS[Alert Management]
    end

    MPCB --> INGEST
    OpenAQ --> INGEST
    CSV --> INGEST
    INGEST --> READINGS
    READINGS --> AQI_CALC
    AQI_CALC --> STATIONS
    READINGS --> FEATURE
    FEATURE --> TRAIN
    TRAIN --> XGB
    XGB --> PRED_SERVICE
    PRED_SERVICE --> PREDICTIONS
    SCHEDULER --> INGEST
    SCHEDULER --> PRED_SERVICE
    
    STATIONS --> API[API Endpoints]
    READINGS --> API
    PREDICTIONS --> API
    USERS --> API
    
    API --> DASHBOARD
    API --> STATIONS
    API --> ANALYTICS
    API --> ALERTS
    API --> LANDING
```

---

## Model Training Pipeline

```mermaid
flowchart LR
    subgraph DataIngestion["Data Ingestion"]
        RAW[(Raw CSV Data)]
        CLEAN[Data Cleaning]
        VALIDATE[Validation]
    end

    subgraph FeatureEngineering["Feature Engineering"]
        TEMP[Temporal Features]
        LAG[Lagged Features]
        ROLL[Rolling Averages]
        FEATURES[(Feature Store)]
    end

    subgraph ModelTraining["Model Training"]
        SPLIT[Train/Test Split]
        XGB[XGBoost]
        TUNE[Hyperparameter Tuning]
        MODEL[(Saved Model)]
    end

    subgraph Evaluation["Evaluation"]
        MAE[MAE Score]
        RMSE[RMSE Score]
        FEATURE_IMP[Feature Importance]
    end

    RAW --> CLEAN --> VALIDATE --> TEMP
    TEMP --> LAG --> ROLL --> FEATURES
    FEATURES --> SPLIT --> XGB
    XGB --> TUNE
    TUNE --> MODEL
    MODEL --> MAE
    MODEL --> RMSE
    MODEL --> FEATURE_IMP
```

---

## Prediction Flow

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Frontend as React App
    participant API as ⚡ FastAPI
    participant DB as Database
    participant ML as ML Model
    participant Sched as Scheduler

    Note over User,Sched: Real-time Data Flow

    Sched->>API: Trigger Ingestion Job (15 min)
    API->>OpenAQ: Fetch Live Data
    OpenAQ-->>API: Return Readings
    API->>DB: Upsert Readings
    API->>DB: Calculate AQI

    User->>Frontend: Open Dashboard
    Frontend->>API: GET /aqi/realtime
    API->>DB: Query Latest Readings
    DB-->>API: Return AQI Data
    API-->>Frontend: Display Live AQI

    Note over User,Sched: 48-Hour Prediction Flow

    User->>Frontend: Click Station
    Frontend->>API: GET /predictions/{id}
    
    alt Predictions in DB
        API->>DB: Query Predictions
        DB-->>API: Return Cached
    else No Predictions
        API->>ML: Generate Predictions
        ML-->>API: Return Forecast
        API->>DB: Store Predictions
    end
    
    API-->>Frontend: Show 48h Forecast
    Frontend-->>User: Display Chart
```

---

## AQI Calculation Flow

```mermaid
flowchart TB
    subgraph Input["Raw Pollutant Data"]
        PM25[PM2.5]
        PM10[PM10]
        NO2[NO2]
        SO2[SO2]
        O3[O3]
        CO[CO]
    end

    subgraph Conversion["Unit Conversion"]
        PM25_UG[PM2.5]
        PM10_UG[PM10]
        NO2_UG[NO2]
        SO2_UG[SO2]
        O3_UG[O3]
        CO_UG[CO]
    end

    subgraph SubIndex["Sub-Index Calculation"]
        SI_PM25[PM2.5 Index]
        SI_PM10[PM10 Index]
        SI_NO2[NO2 Index]
        SI_SO2[SO2 Index]
        SI_O3[O3 Index]
        SI_CO[CO Index]
    end

    subgraph Final["Final AQI"]
        MAX[Max of All Indices]
        AQI[AQI Category]
    end

    PM25 --> PM25_UG
    PM10 --> PM10_UG
    NO2 --> NO2_UG
    SO2 --> SO2_UG
    O3 --> O3_UG
    CO --> CO_UG

    PM25_UG --> SI_PM25
    PM10_UG --> SI_PM10
    NO2_UG --> SI_NO2
    SO2_UG --> SI_SO2
    O3_UG --> SI_O3
    CO_UG --> SI_CO

    SI_PM25 --> MAX
    SI_PM10 --> MAX
    SI_NO2 --> MAX
    SI_SO2 --> MAX
    SI_O3 --> MAX
    SI_CO --> MAX

    MAX --> AQI
```

---

## Technology Stack

### Backend
| Technology | Purpose |
|------------|---------|
| FastAPI | REST API framework |
| SQLAlchemy | ORM |
| SQLite/PostgreSQL | Database |
| APScheduler | Job scheduling |
| XGBoost | ML predictions |
| Pandas/NumPy | Data processing |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI library |
| Vite | Build tool |
| TailwindCSS | Styling |
| Recharts | Charts |
| React Router | Navigation |
| Axios | HTTP client |

### DevOps
| Technology | Purpose |
|------------|---------|
| Git/GitHub | Version control |
| Vercel | Frontend hosting |
| Railway | Backend hosting |

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
# Clone repository
git clone https://github.com/DarshK25/AirWatch.git
cd AirWatch/fastapi_app

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Start server
python run.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Project Structure

```
AirWatch/
├── fastapi_app/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/               # API Endpoints
│   │   ├── core/              # Config, Auth, Database
│   │   ├── models/            # SQLAlchemy Models
│   │   ├── schemas/          # Pydantic Schemas
│   │   └── services/         # Business Logic
│   │       ├── aqi_calculator.py
│   │       ├── ingestion.py
│   │       ├── ml_pipeline.py
│   │       └── prediction_service.py
│   ├── ml_models/             # Trained Models
│   ├── ml_data/              # Training Data
│   └── run.py                 # Entry Point
│
└── frontend/                  # React Frontend
    ├── src/
    │   ├── components/       # UI Components
    │   ├── pages/            # Page Views
    │   ├── context/          # React Context
    │   ├── services/         # API Services
    │   └── utils/            # Utilities
    └── package.json
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/stations/` | List all stations |
| GET | `/api/v1/aqi/realtime/` | Real-time AQI data |
| GET | `/api/v1/aqi/history/{id}` | Historical readings |
| GET | `/api/v1/predictions/{id}` | 48-hour forecast |
| POST | `/api/v1/auth/register` | User registration |
| POST | `/api/v1/auth/login` | User login |

---

## 🎯 Model Performance

| Metric | Value |
|--------|-------|
| Algorithm | XGBoost Regressor |
| MAE | ~15-25 AQI units |
| Features | 24 (temporal + lag + rolling) |
| Forecast Horizon | 48 hours |
| Retraining Frequency | Daily (2 AM IST) |

---

## Deployment Guide

### Option 1: Vercel + Railway (Recommended)

#### Backend - Railway
1. Create account at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select `fastapi_app` folder
4. Add environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET_KEY`
5. Railway auto-detects Python, deploys!

#### Frontend - Vercel
1. Create account at [vercel.com](https://vercel.com)
2. Import GitHub repository
3. Set root directory to `frontend`
4. Add environment variable:
   - `VITE_API_BASE_URL` = your-railway-url/api/v1
5. Deploy!

#### Cost: **Free tier** sufficient for demo

---

### Option 2: Render + Netlify

#### Backend - Render
```bash
# render.yaml
services:
  - type: web
    name: airwatch-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: cd fastapi_app && gunicorn app.main:app
```

#### Frontend - Netlify
```bash
# netlify.toml
[build]
  command = "cd frontend && npm install && npm run build"
  publish = "frontend/dist"
```

---

### Option 3: Docker Deployment

```dockerfile
# Backend
FROM python:3.10-slim
WORKDIR /app
COPY fastapi_app/requirements.txt .
RUN pip install -r requirements.txt
COPY fastapi_app/ .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Build and run
docker build -t airwatch-backend .
docker run -p 8000:8000 airwatch-backend

# Frontend (nginx)
docker build -t airwatch-frontend ./frontend
docker run -p 3000:80 airwatch-frontend
```

---

### Option 4: Railway One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

1. Fork this repository
2. Click deploy button above
3. Connect GitHub
4. Set environment variables
5. Done!

---

## Environment Variables

### Backend (`fastapi_app/.env`)
```env
DATABASE_URL=sqlite:///./airwatch.db
JWT_SECRET_KEY=your-super-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## Changing Database URL (Without Data Loss)

To migrate from SQLite to PostgreSQL or another database:

### Step 1: Export Current Data (SQLite)
```bash
cd fastapi_app
# The SQLite database file is: airwatch.db
cp airwatch.db airwatch_backup.db
```

### Step 2: Update Environment Variable
Edit `fastapi_app/.env`:
```env
# For PostgreSQL
DATABASE_URL=postgresql://username:password@host:5432/airwatch_db

# For MySQL
DATABASE_URL=mysql+pymysql://username:password@host:3306/airwatch_db

# For SQLite (default)
DATABASE_URL=sqlite:///./airwatch.db
```

### Step 3: Migrate Data
```bash
# Install database tool if needed
pip install pg-loader  # For PostgreSQL

# Option A: Use SQLAlchemy to create new tables
python -c "from app.core.db import engine; from app.models import aqi, user; aqi.Base.metadata.create_all(engine); user.Base.metadata.create_all(engine)"

# Option B: Manual migration with pg_dump/pg_restore for PostgreSQL
pg_dump -h localhost -U username -d airwatch_db > backup.sql
psql -h host -U username -d new_airwatch_db < backup.sql
```

### Step 4: Restart Backend
```bash
python run.py
```

### Database URL Formats
| Database | URL Format |
|----------|-----------|
| SQLite | `sqlite:///./airwatch.db` |
| PostgreSQL | `postgresql://user:pass@host:5432/dbname` |
| MySQL | `mysql+pymysql://user:pass@host:3306/dbname` |
| Supabase | `postgresql://user:pass@host:5432/dbname` |
| Neon | `postgresql://user:pass@host:5432/dbname?sslmode=require` |

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

MIT License - see LICENSE file for details.

---

## Acknowledgments

- **Data Source**: Maharashtra Pollution Control Board (MPCB)
- **Stations**: Thane-Belapur Industrial Corridor, Navi Mumbai
- **AQI Standards**: Central Pollution Control Board (CPCB), India

---

<p align="center">
  <strong>Built with ❤️ for cleaner air</strong>
  <br>
  <a href="https://github.com/DarshK25/AirWatch">GitHub</a> •
  <a href="https://airwatch-pro.vercel.app">Live Demo</a>
</p>
