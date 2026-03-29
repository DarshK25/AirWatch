# 🎯 AirWatch Pro - Complete System Status & Ship Plan

---

## 📊 EXECUTIVE SUMMARY

**Current Date:** March 26, 2026 | **Time:** 11:13 PM IST

| Metric | Status | Details |
|--------|--------|---------|
| **Backend API** | ✅ Ready | FastAPI + SQLAlchemy, 978k readings loaded |
| **Database** | 🟡 Partial | 5 of 6 stations miss Sep 2025 → Mar 2026 data (-6 months) |
| **Scheduler** | ✅ Ready | APScheduler: 3 jobs configured (ingest, predict, retrain) |
| **Frontend UI** | 🟡 Partial | Components exist but may not be wired to live APIs |
| **ML Model** | ✅ Ready | XGBoost trained, 288 cached predictions |
| **Authentication** | ⏳ Setup | Endpoints exist, UI not wired |
| **Deployment** | ❌ None | No Docker/production config |

---

## 🔴 CRITICAL GAPS & What's Fake/Static

### 1. **Data Incompleteness (BIGGEST ISSUE)**
- **Problem**: 5 of 6 weather stations are 6 months behind
  - Station 3409469: ✅ TODAY (Mar 26, 2026) 
  - 5 Others: ❌ Sep 6, 2025 only

- **Cause**: Live ingestion pipeline started late, OpenAQ API rate limit (40 req/min) makes backfill slow
- **Impact**: Dashboard shows stale data, predictions based on ancient trends
- **Fix**: Let ingestion job run for 1-2 hours to catch up

### 2. **Frontend Data Fetching (POTENTIALLY STATIC)**
- **Files**: 
  - [frontend/src/context/AirQualityContext.jsx](frontend/src/context/AirQualityContext.jsx)
  - [frontend/src/pages/main-dashboard/index.jsx](frontend/src/pages/main-dashboard/index.jsx)
- **Check Required**: Is it fetching from `/api/v1/stations` or using hardcoded/mock data?
- **Endpoints Available**:
  ```
  GET  /api/v1/stations                    → All monitoring stations
  GET  /api/v1/readings/{station_id}       → Latest readings for station
  GET  /api/v1/predictions/{station_id}    → 48h AQI forecast
  ```

### 3. **Pages Not Wired to Backend**
| Page | Component | Status | Issue |
|------|-----------|--------|-------|
| Alerts Management | [pages/alerts-management](frontend/src/pages/alerts-management) | ❌ | UI only, no backend calls |
| Historical Analytics | [pages/historical-analytics](frontend/src/pages/historical-analytics) | ❌ | UI only, no data queries |
| Implementation Status | [pages/implementation-status](frontend/src/pages/implementation-status) | ❓ | Likely static checklist |
| Station Details | [pages/station-details](frontend/src/pages/station-details) | ❓ | Not inspected |
| User Profile | Components/UserProfileDropdown | ❓ | Not inspected |

### 4. **User System Not Tested**
- **Endpoints**: 
  - `POST /auth/register` 
  - `POST /auth/login`
  - `POST /auth/logout`
- **Status**: Implemented but never tested
- **Issue**: 0 users in database, no signup/login flow verification

### 5. **Predictions Are Stale**
- **Last Trained**: Oct 10, 2025 on data up to Sep 6, 2025
- **Current Real Data**: Mar 26, 2026
- **Issue**: 288 predictions in DB from 6 months ago, forecasts invalid
- **Fix**: After data backfill, run retraining job (takes ~5-10 min)

---

## ✅ What's FULLY IMPLEMENTED & WORKS

### Backend API (All Endpoints)
```python
# Scheduler Control
GET  /api/v1/scheduler/status           → See scheduler state, next run times
POST /api/v1/scheduler/run/ingestion    → Manually trigger data fetch
POST /api/v1/scheduler/run/predictions  → Manually trigger forecasting  
POST /api/v1/scheduler/run/retrain      → Manually trigger model retraining

# Data Queries
GET  /api/v1/stations                   → List all 6 stations with latest readings
GET  /api/v1/readings/{station_id}      → Raw sensor readings, paginated
GET  /api/v1/readings/search             → Advanced filtering (date, param, etc.)
GET  /api/v1/predictions/{station_id}   → 48h AQI forecast

# Authentication
POST /auth/register                      → Sign up (email, password, name)
POST /auth/login                         → Sign in (returns JWT token)
POST /auth/logout                        → Sign out
GET  /auth/me                           → Get current user
```

### Database Schema
- **readings**: 978k sensor readings (CO, NO, NO2, O3, PM10, PM25, RH, SO2, Temp)
- **predictions**: 48h AQI forecasts per station
- **stations**: 6 monitoring locations in Thane-Belapur region
- **users**: User accounts with JWT auth
- **Unique Index**: (station_id, datetime, parameter) for idempotent ingestion

### APScheduler Jobs (Automated)
1. **live_ingestion** (every 15 min)
   - Fetches new readings from OpenAQ API
   - Only fetches data newer than DB's latest timestamp
   - Parallel: 4 worker threads, global 1.6s request wait (respects 40 req/min limit)
   - Retry: 5x exponential backoff on 429 errors
   - Upsert: INSERT OR IGNORE if duplicates

2. **generate_predictions** (every 1 hour)
   - Runs XGBoost model on latest readings
   - Generates 48h forecast for each station
   - Stores in DB with model version tag

3. **retrain_model** (daily at 2 AM IST)
   - Fetches fresh training data from DB
   - Recomputes features (lag, cyclical encoding)
   - Retrains XGBoost, saves to disk
   - Model lives in: [fastapi_app/ml_models/xgb_tuned_aqi_model.joblib](fastapi_app/ml_models/xgb_tuned_aqi_model.joblib)

### ML Features
- **Model**: XGBoost (Gradient Boosting)
- **Features Used**: 26 features
  - Raw sensors: CO, NO, NO2, O3, PM10, PM25, RH, SO2, Temperature
  - Temporal: day_of_week, month, hour_sin (cyclical), hour_cos (cyclical)
  - Lags: AQI, PM2.5, NO2 from 1/2/3/4 hours ago
- **Target**: AQI (computed from pollutants)
- **Training Data**: Sep 2021 → Sep 2025 (~4 years)

---

## 🟡 PARTIALLY DONE - Needs Wiring

### Frontend Integration Points
1. **Replace Context Mocks with Real API Calls**
   - [frontend/src/utils/api.js](frontend/src/utils/api.js) - HTTP helper already exists
   - [frontend/src/context/AirQualityContext.jsx](frontend/src/context/AirQualityContext.jsx) - Update to fetch from API
   
2. **Wire Dashboard to Live Data**
   - Main dashboard should call `GET /api/v1/stations` on load
   - Auto-refresh every 5 min (optional, or keep manual refresh button)
   
3. **Wire Auth Pages**
   - Register page → `POST /auth/register` + JWT to localStorage
   - Login page → `POST /auth/login` + JWT to localStorage
   - Profile dropdown → `GET /auth/me` to show user
   - Logout → `POST /auth/logout` + clear JWT

### Pages to Complete
- **Alerts Page**: Need to define alert rules (thresholds), check if backend already has /api/v1/alerts/
- **Historical Analytics**: Date range picker → `GET /api/v1/readings/search?station_id=...&from=...&to=...`
- **Station Details**: Show detailed trends, last update, sensor breakdown
- **User Profile**: Show user info, settings, logout button

---

## 🔧 How to Complete & Ship (5-Phase Plan)

### **PHASE 1: Complete Data Backfill** (30 min - 2 hours)
**What**: Fill the 6-month gap for 5 stations
**How**:
```bash
# Option A: Wait - APScheduler runs every 15 min automatically
#   →  5 stations × 9 sensors × ~30 weeks = ~1350 requests
#   →  @ 40 req/min = 34 minutes total
#   →  Will complete around Mar 27, 2 AM IST

# Option B: Accelerate manually
curl -X POST http://localhost:8000/api/v1/scheduler/run/ingestion
# Wait 45 min, check DB
curl http://localhost:8000/api/v1/scheduler/status
```

**Success Criteria**:
- All 6 stations have data from Mar 26, 2026
- `SELECT MAX(datetime) FROM readings` → shows today's date for all stations

---

### **PHASE 2: Wire Frontend to APIs** (2-3 hours)

**Files to Edit**:
1. [frontend/src/context/AirQualityContext.jsx](frontend/src/context/AirQualityContext.jsx)
   ```jsx
   // Replace mock with:
   useEffect(() => {
     fetch('/api/v1/stations')
       .then(r => r.json())
       .then(data => setEnrichedStations(data))
       .catch(err => setError(err.message))
   }, [])
   ```

2. [frontend/src/utils/api.js](frontend/src/utils/api.js) - Already has `api()` helper, use it

3. Login/Register Flow:
   ```jsx
   // Register
   POST /auth/register { email, password, name }
   → localStorage.setItem('token', response.access_token)
   
   // Login  
   POST /auth/login { email, password }
   → localStorage.setItem('token', response.access_token)
   
   // Every request
   headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
   ```

**Test Commands**:
```bash
# Test API directly
curl http://localhost:8000/api/v1/stations | jq
curl -H "Content-Type: application/json" -X POST \
  -d '{"email":"test@example.com","password":"pass123","name":"Test"}' \
  http://localhost:8000/auth/register
```

---

### **PHASE 3: Implement Missing Pages** (2-4 hours)

| Page | Component | Wiring |
|------|-----------|--------|
| **Alerts** | [pages/alerts-management](frontend/src/pages/alerts-management) | `GET /api/v1/alerts`, define alert rules |
| **History** | [pages/historical-analytics](frontend/src/pages/historical-analytics) | Date picker → `GET /api/v1/readings/search?from=...&to=...` |
| **Station Details** | [pages/station-details](frontend/src/pages/station-details) | Drill into `/api/v1/readings/{id}`, show trends |
| **Profile** | User dropdown | `GET /auth/me`, logout button |

**Alerts SQL** (if backend doesn't have yet):
```sql
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY,
  station_id INTEGER,
  parameter TEXT,
  threshold REAL,
  condition TEXT,  -- 'above' or 'below'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### **PHASE 4: Polish & Hardening** (2-3 hours)

- [ ] Fix all console errors/warnings
- [ ] Add loading skeletons for slow pages
- [ ] 404/500 error pages
- [ ] Mobile responsiveness (test on phone)
- [ ] Accessibility check (tab navigation, screen readers)
- [ ] Test auth flow end-to-end
- [ ] Test data stale older than 1 hour shows warning

---

### **PHASE 5: Deploy to Production** (1-2 hours)

**Option A: Docker (Recommended)**
```dockerfile
# Create Dockerfile for backend + frontend
# Create docker-compose.yml for orchestration
# Test locally: docker-compose up
# Deploy: push to registry, deploy on Heroku/AWS/Azure
```

**Option B: Render.com / Railway.app (Easiest)
```bash
# Connect GitHub repo
# Auto-build on push
# Set environment variables (OPENAQ_API_KEY, DATABASE_URL)
# Deploy
```

**Option C: Traditional VPS**
- SSH to server
- Clone repo, install deps
- Start with systemd/supervisor
- Reverse proxy with nginx

**Environment Setup**:
```bash
# .env for production
DATABASE_URL=postgresql://user:pass@host:5432/airwatch
OPENAQ_API_KEY=your-key-here
JWT_SECRET=strong-random-secret-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

## 📈 Progress Checklist

- [ ] **PHASE 1**: Data backfilled for all 6 stations
- [ ] **PHASE 2**: Dashboard fetches from `/api/v1/stations` (not mocked)
- [ ] **PHASE 2**: Authentication works (register/login/logout)
- [ ] **PHASE 3**: Alerts page functional
- [ ] **PHASE 3**: Historical analytics functional
- [ ] **PHASE 4**: All console errors resolved
- [ ] **PHASE 4**: Mobile responsive
- [ ] **PHASE 5**: Deployed to HTTP(S)

---

## 🚀 Commands to Get Running NOW

```bash
# Terminal 1: Backend
cd fastapi_app
python -c "import sys; sys.path.insert(0, '.'); import uvicorn; uvicorn.run('app.main:app', host='0.0.0.0', port=8000)"

# Terminal 2: Frontend
cd frontend
npm run dev  # Visit http://localhost:4028

# Terminal 3: Monitor scheduler (optional)
watch -n 10 'curl -s http://localhost:8000/api/v1/scheduler/status | python -m json.tool'

# Terminal 4: Manual triggers (when ready)
curl -X POST http://localhost:8000/api/v1/scheduler/run/ingestion     # Fetch new data
curl -X POST http://localhost:8000/api/v1/scheduler/run/predictions   # Generate forecast
curl -X POST http://localhost:8000/api/v1/scheduler/run/retrain       # Retrain model
```

---

## 📋 Folder Structure
```
AirWatch/
├── fastapi_app/                    ← Backend
│   ├── app/
│   │   ├── core/
│   │   │   ├── scheduler.py         ✅ APScheduler jobs
│   │   │   ├── config.py            ✅ Settings & .env
│   │   │   ├── db.py                ✅ SQLAlchemy session
│   │   │   └── auth.py              ✅ JWT token logic
│   │   ├── services/
│   │   │   ├── live_ingestion.py    ✅ Parallel OpenAQ fetcher
│   │   │   ├── ml_pipeline.py       ✅ XGBoost trainer
│   │   │   ├── prediction_service.py ✅ Forecast generator
│   │   │   └── aqi_calculator.py    ✅ AQI computation
│   │   ├── models/
│   │   │   ├── aqi.py               ✅ ORM models
│   │   │   └── user.py              ✅ User model
│   │   ├── api/
│   │   │   └── endpoints.py         ✅ All REST endpoints
│   │   └── schemas/
│   │       └── auth.py              ✅ Request/response models
│   ├── ml_models/
│   │   └── xgb_tuned_aqi_model.joblib ✅ Trained model
│   ├── ml_data/
│   │   └── ml_feature_store.csv     ✅ Feature cache
│   └── airwatch.db                  ✅ SQLite DB (978k readings)
│
├── frontend/                        ← UI (React + Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── main-dashboard/      ⏳ Needs API wiring
│   │   │   ├── alerts-management/   ❌ No backend wiring
│   │   │   ├── historical-analytics/ ❌ No backend wiring
│   │   │   ├── login/               ⏳ Needs API wiring
│   │   │   ├── register/            ⏳ Needs API wiring
│   │   │   └── station-details/     ❓ Not inspected
│   │   ├── context/
│   │   │   └── AirQualityContext.jsx ⏳ Fetches data (may be mocked)
│   │   ├── components/
│   │   │   └── ui/                  ✅ Reusable UI components
│   │   ├── utils/
│   │   │   └── api.js               ✅ HTTP client ready
│   │   └── styles/
│   │       └── index.css            ✅ Tailwind configured
│   ├── vite.config.mjs              ✅ Build config
│   └── package.json                 ✅ Dependencies
│
├── docs/
│   ├── API.md                       ✅ API documentation
│   ├── ARCHITECTURE.md              ✅ System design
│   └── REAL_DATA_INTEGRATION_COMPLETE.md
│
└── .env                             ✅ Environment variables (API keys, etc.)
```

---

## 🎯 TL;DR - To SHIP on Monday Morning

1. **Let data backfill** (happens automatically via scheduler, takes 1-2 hours)
2. **Wire frontend pages** to API (Phase 2, takes 2-3 hours):
   - AirQualityContext → fetch from `/api/v1/stations`
   - Auth pages → call `/auth/register` and `/auth/login`
   - Dashboard → show real data, not mocks
3. **Quick test**: Can you sign up, log in, see current readings, view forecast?
4. **Deploy** (Docker or Railway, takes 1 hour)

---

**Generated**: March 26, 2026 23:13:12 IST  
**System**: AirWatch Pro - Air Quality Monitoring & ML Prediction Platform
