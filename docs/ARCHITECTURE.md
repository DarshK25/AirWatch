# AirWatch Pro Architecture

## System Overview

AirWatch Pro is a full-stack application for real-time air quality monitoring and prediction using machine learning. The system consists of a FastAPI backend, React frontend, PostgreSQL database, and machine learning pipeline.

## Architecture Diagram

```
┌─────────────────┐
│   React Client  │
│   (Frontend)    │
└────────┬────────┘
         │ HTTP/REST
         │
┌────────▼────────┐
│  FastAPI Server │
│   (Backend)     │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬───────────┐
    │         │          │           │
┌───▼───┐ ┌──▼──┐  ┌────▼────┐ ┌────▼────┐
│  Auth │ │ API │  │   ML    │ │   Data  │
│Service│ │Layer│  │Pipeline │ │Ingestion│
└───────┘ └─────┘  └────┬────┘ └────┬────┘
                        │           │
                    ┌───▼───────────▼───┐
                    │   PostgreSQL DB   │
                    └───────────────────┘
```

## Component Architecture

### Frontend Layer

**Technology:** React 18 + Vite + TailwindCSS

**Key Components:**
- Dashboard - Main overview with station cards
- StationDetails - Detailed view for individual stations
- MapView - Interactive map with station markers
- Charts - Pollutant trends and predictions
- AuthForms - Login and registration

**State Management:**
- Redux Toolkit for global state
- React hooks for local state
- Axios for API communication

**Routing:**
```
/ - Dashboard (protected)
/station/:id - Station details (protected)
/analytics - Historical analytics (protected)
/login - Authentication
/register - User registration
```

### Backend Layer

**Technology:** FastAPI + SQLAlchemy + Pydantic

**Module Structure:**

```
app/
├── api/
│   └── endpoints.py       # API routes
├── core/
│   ├── auth.py           # JWT authentication
│   ├── config.py         # Configuration
│   └── db.py             # Database connection
├── models/
│   ├── aqi.py            # Station, Reading, Prediction
│   └── user.py           # User model
├── schemas/
│   └── auth.py           # Pydantic schemas
└── services/
    ├── aqi_calculator.py # AQI computation
    ├── ingestion.py      # Data loading
    ├── ml_pipeline.py    # ML training
    ├── ml_feature_store.py # Feature engineering
    └── prediction_service.py # Prediction generation
```

**Request Flow:**
1. Client sends HTTP request
2. FastAPI receives and validates request
3. Authentication middleware checks JWT token
4. Endpoint handler processes request
5. Service layer executes business logic
6. Database layer performs CRUD operations
7. Response is serialized and returned

### Database Layer

**Technology:** PostgreSQL 14+

**Schema:**

#### stations
```sql
CREATE TABLE stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    lat FLOAT NOT NULL,
    lon FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### readings
Stores raw sensor measurements.
```sql
CREATE TABLE readings (
    id SERIAL PRIMARY KEY,
    station_id INTEGER REFERENCES stations(id),
    timestamp TIMESTAMP NOT NULL,
    parameter VARCHAR(50) NOT NULL,  -- pm25, pm10, no2, so2, o3, co
    value FLOAT NOT NULL,
    unit VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### aqi_readings
Stores calculated AQI values.
```sql
CREATE TABLE aqi_readings (
    id SERIAL PRIMARY KEY,
    station_id INTEGER REFERENCES stations(id),
    timestamp TIMESTAMP NOT NULL,
    overall_aqi INTEGER NOT NULL,
    aqi_category VARCHAR(50) NOT NULL,
    pm25_aqi INTEGER,
    pm10_aqi INTEGER,
    no2_aqi INTEGER,
    so2_aqi INTEGER,
    o3_aqi INTEGER,
    co_aqi INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### predictions
Stores ML-generated predictions.
```sql
CREATE TABLE predictions (
    id SERIAL PRIMARY KEY,
    station_id INTEGER REFERENCES stations(id),
    prediction_time TIMESTAMP NOT NULL,
    predicted_aqi INTEGER NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(station_id, prediction_time)
);
```

#### users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
```sql
CREATE INDEX idx_readings_station_time ON readings(station_id, timestamp);
CREATE INDEX idx_aqi_station_time ON aqi_readings(station_id, timestamp);
CREATE INDEX idx_predictions_station_time ON predictions(station_id, prediction_time);
```

### Machine Learning Pipeline

**Technology:** scikit-learn + XGBoost

**Pipeline Stages:**

1. **Data Ingestion**
   - Load CSV data
   - Parse timestamps
   - Validate data quality

2. **Feature Engineering**
   - Temporal features (hour, day, month)
   - Rolling averages (3h, 6h, 12h, 24h)
   - Lag features (previous 1h, 3h, 6h values)
   - Station-specific features

3. **Model Training**
   - Algorithm: XGBoost Regressor
   - Target: AQI value
   - Train/test split: 80/20
   - Cross-validation: 5-fold

4. **Prediction Generation**
   - 48-hour forecast (hourly)
   - Uses latest readings as input
   - Recursive prediction for future hours

**Feature Set:**
```python
features = [
    'hour', 'day_of_week', 'month',
    'pm25', 'pm10', 'no2', 'so2', 'o3', 'co',
    'pm25_lag1h', 'pm25_lag3h', 'pm25_lag6h',
    'pm10_rolling_3h', 'pm10_rolling_12h',
    'no2_rolling_6h', 'no2_rolling_24h',
    'temperature', 'humidity'  # if available
]
```

**Model Performance:**
- RMSE: Target < 15 AQI points
- R² Score: Target > 0.85
- MAE: Target < 10 AQI points

### Authentication & Security

**JWT Authentication:**
```python
# Token payload
{
    "sub": "user_id",
    "exp": 1234567890  # Expiration timestamp
}
```

**Password Security:**
- Hashing: bcrypt
- Salt rounds: 12
- Never store plaintext passwords

**Security Headers:**
- CORS configured for frontend origin
- Content-Security-Policy (recommended for production)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY

## Data Flow

### Real-Time AQI Request

```
1. User opens dashboard
2. Frontend calls GET /api/v1/aqi/realtime/
3. Backend queries latest readings from DB
4. AQI Calculator computes sub-indices
5. Response with AQI and pollutant data
6. Frontend renders station cards and map
```

### Prediction Request

```
1. User clicks station for details
2. Frontend calls GET /api/v1/predictions/{station_id}
3. Backend checks for existing predictions
4. If none exist, trigger ML pipeline
5. ML service generates 48h forecast
6. Predictions saved to DB
7. Response with prediction array
8. Frontend renders prediction chart
```

### Data Ingestion

```
1. Run setup_db.py script
2. Read all_locations_merged.csv
3. Parse and validate data
4. Bulk insert into readings table
5. Calculate AQI for all readings
6. Insert into aqi_readings table
7. Generate initial predictions
```

## Deployment Architecture

### Development

```
Frontend: Vite dev server (port 5173)
Backend: Uvicorn (port 8000)
Database: PostgreSQL (port 5432)
```

### Production (Recommended)

```
Frontend: Nginx serving static build
Backend: Gunicorn + Uvicorn workers
Database: PostgreSQL with connection pooling
Reverse Proxy: Nginx
SSL/TLS: Let's Encrypt certificates
```

## Scalability Considerations

**Current Limitations:**
- Single server deployment
- No caching layer
- Synchronous prediction generation
- Limited to PostgreSQL vertical scaling

**Scaling Strategies:**
1. **Horizontal Scaling:** Load balancer + multiple backend instances
2. **Caching:** Redis for frequent queries (stations, latest AQI)
3. **Async Processing:** Celery for prediction jobs
4. **Database:** Read replicas for analytics queries
5. **CDN:** Static asset delivery

## Performance Optimization

**Backend:**
- Database query optimization with proper indexes
- Connection pooling (SQLAlchemy)
- Async endpoints for I/O operations
- Response caching for static data

**Frontend:**
- Code splitting and lazy loading
- React.memo for expensive components
- Debounced API calls
- Service worker for offline support

**Database:**
- Partitioning readings table by timestamp
- Materialized views for aggregations
- Query result caching

## Monitoring & Logging

**Recommended Tools:**
- Application: Sentry for error tracking
- Performance: New Relic or DataDog
- Logs: ELK stack (Elasticsearch, Logstash, Kibana)
- Uptime: UptimeRobot or Pingdom

**Key Metrics:**
- API response time
- Database query performance
- Prediction accuracy
- User authentication success rate
- Error rates by endpoint

## Future Enhancements

1. **Real-time Updates:** WebSocket for live data streaming
2. **Mobile App:** React Native version
3. **Advanced Analytics:** Heatmaps, correlation analysis
4. **Alert System:** Email/SMS notifications for poor AQI
5. **Multi-tenant:** Support for multiple industrial corridors
6. **API Rate Limiting:** Prevent abuse
7. **Data Export:** CSV/Excel download functionality
8. **Admin Dashboard:** Manage stations and users
