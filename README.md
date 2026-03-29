# AirWatch Pro

![Air Quality Monitoring](https://img.shields.io/badge/Air%20Quality-Monitoring-blue)
![ML Predictions](https://img.shields.io/badge/ML-Predictions-purple)
![FastAPI](https://img.shields.io/badge/FastAPI-Ready-green)
![React](https://img.shields.io/badge/React-18-blue)

A real-time air quality monitoring and prediction system for industrial corridors using machine learning.

## 🌟 Key Features

- **Real-time Monitoring** - Live AQI data from 6 monitoring stations
- **48-Hour Predictions** - XGBoost ML model forecasts AQI ahead
- **Interactive Dashboard** - React-based UI with charts and maps
- **Historical Analytics** - Trend analysis and data export
- **Smart Alerts** - Configurable threshold notifications
- **User Authentication** - JWT-based secure access

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Data Sources                              │
│   MPCB Stations  │  OpenAQ API  │  Historical CSV Data          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FastAPI Backend                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │Data Ingestion│  │AQI Calculator│  │  Prediction Service    │  │
│  │  Service     │  │  (CPCB)      │  │  (XGBoost ML)        │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    APScheduler                            │  │
│  │          (Ingestion: 15min │ Predictions: 1hr)          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SQLite Database                            │
│     Stations │ Readings │ Predictions │ Users                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      REST API (8080)                           │
│    /stations │ /aqi/realtime │ /predictions │ /auth           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   React Frontend (5173)                        │
│   Landing │ Dashboard │ Stations │ Analytics │ Alerts             │
└─────────────────────────────────────────────────────────────────┘
```

### View Detailed Architecture

For complete architecture diagrams with data flow, ML pipeline, and prediction sequence:
📄 **[View Architecture Docs](docs/ARCHITECTURE.md)**

---

## 🤖 ML Model Details

| Component | Description |
|----------|-------------|
| **Algorithm** | XGBoost Regressor |
| **Features** | 24 (Temporal + Lagged + Rolling Averages) |
| **Forecast** | 48-hour ahead predictions |
| **Retraining** | Daily at 2 AM IST |
| **MAE** | ~15-25 AQI units |

### Prediction Flow
```
1. User requests /predictions/{station_id}
2. API checks database for cached predictions
3. If no predictions → Generate using ML model
4. Store predictions in database
5. Return 24-hour forecast to frontend
6. Display chart with actual vs predicted
```

---

## 🚀 Quick Start

### Backend
```bash
cd fastapi_app
pip install -r requirements.txt
python run.py
# API: http://localhost:8000
# Docs: http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App: http://localhost:5173
```

---

## 📁 Project Structure

```
AirWatch/
├── fastapi_app/              # FastAPI Backend
│   ├── app/
│   │   ├── api/           # Endpoints
│   │   ├── core/          # Config, Auth, DB
│   │   ├── models/        # SQLAlchemy
│   │   └── services/      # ML, AQI, Ingestion
│   ├── ml_models/          # Trained XGBoost
│   └── run.py
│
└── frontend/                # React Frontend
    ├── src/
    │   ├── pages/         # Dashboard, Stations, etc.
    │   ├── components/     # UI Components
    │   └── context/        # AirQuality Context
    └── package.json
```

---

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/stations/` | List all stations |
| GET | `/api/v1/aqi/realtime/` | Real-time AQI |
| GET | `/api/v1/aqi/history/{id}` | Historical data |
| GET | `/api/v1/predictions/{id}` | 48-hour forecast |
| POST | `/api/v1/auth/register` | Register |
| POST | `/api/v1/auth/login` | Login |

---

## 🌐 Deployment

### Railway + Vercel (Recommended)

**Backend → Railway:**
1. Create project at [railway.app](https://railway.app)
2. Deploy from GitHub (`fastapi_app` folder)
3. Set `DATABASE_URL` and `JWT_SECRET_KEY`

**Frontend → Vercel:**
1. Create project at [vercel.com](https://vercel.com)
2. Set root directory to `frontend`
3. Add `VITE_API_BASE_URL` = your-railway-url

### Docker
```bash
# Backend
docker build -t airwatch-api ./fastapi_app
docker run -p 8000:8000 airwatch-api

# Frontend
docker build -t airwatch-web ./frontend
docker run -p 3000:80 airwatch-web
```

---

## 📜 Environment Variables

**Backend** (`fastapi_app/.env`):
```env
DATABASE_URL=sqlite:///./airwatch.db
JWT_SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Frontend** (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 👥 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push and PR

---

## 📄 License

MIT License

---

## 🙏 Acknowledgments

- **Data**: Maharashtra Pollution Control Board (MPCB)
- **Stations**: Thane-Belapur Industrial Corridor
- **AQI Standards**: Central Pollution Control Board (CPCB)

---

<p align="center">
  <strong>Built with ❤️ for cleaner air</strong>
  <br>
  <a href="https://github.com/DarshK25/AirWatch">GitHub</a>
</p>
