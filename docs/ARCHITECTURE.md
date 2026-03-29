# AirWatch Pro - System Architecture

> **Note**: These diagrams are best viewed in:
> - VS Code with Mermaid Preview extension
> - [Mermaid Live Editor](https://mermaid.live)
> - GitHub with Mermaid plugin

---

## 📊 System Architecture

```mermaid
flowchart TB
    subgraph DataSources["📡 Data Sources"]
        MPCB[MPCB Monitoring Stations]
        OpenAQ[OpenAQ API]
        CSV[Historical CSV Data]
    end

    subgraph Backend["⚙️ Backend - FastAPI"]
        INGEST[Data Ingestion Service]
        AQI_CALC[AQI Calculator]
        ML_PIPELINE[ML Pipeline]
        PRED_SERVICE[Prediction Service]
        SCHEDULER[APScheduler]
    end

    subgraph Database["💾 Database - SQLite"]
        STATIONS[Stations Table]
        READINGS[Readings Table]
        PREDICTIONS[Predictions Table]
        USERS[Users Table]
    end

    subgraph Frontend["🎨 Frontend - React"]
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
    READINGS --> PRED_SERVICE
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

## 🤖 Model Training Pipeline

```mermaid
flowchart LR
    subgraph DataIngestion["1️⃣ Data Ingestion"]
        RAW[(Raw CSV Data)]
        CLEAN[Data Cleaning]
        VALIDATE[Validation]
    end

    subgraph FeatureEngineering["2️⃣ Feature Engineering"]
        TEMP[Temporal Features]
        LAG[Lagged Features]
        ROLL[Rolling Averages]
        FEATURES[(Feature Store)]
    end

    subgraph ModelTraining["3️⃣ Model Training"]
        SPLIT[Train/Test Split]
        XGB[XGBoost]
        TUNE[Hyperparameter Tuning]
        MODEL[(Saved Model)]
    end

    subgraph Evaluation["4️⃣ Evaluation"]
        MAE[MAE Score]
        RMSE[RMSE Score]
    end

    RAW --> CLEAN --> VALIDATE --> TEMP
    TEMP --> LAG --> ROLL --> FEATURES
    FEATURES --> SPLIT --> XGB
    XGB --> TUNE --> MODEL
    MODEL --> MAE
    MODEL --> RMSE
```

---

## 🔮 Prediction Flow

```mermaid
sequenceDiagram
    participant User as User
    participant Frontend as React App
    participant API as FastAPI
    participant DB as Database
    participant ML as ML Model

    User->>Frontend: Open Dashboard
    Frontend->>API: GET /aqi/realtime
    API->>DB: Query Readings
    DB-->>API: Return AQI Data
    API-->>Frontend: Display Live AQI

    User->>Frontend: Click Station
    Frontend->>API: GET /predictions/{id}
    API->>ML: Generate Predictions
    ML-->>API: Return Forecast
    API->>DB: Store Predictions
    API-->>Frontend: Show 48h Forecast
```

---

## 📈 AQI Calculation Flow

```mermaid
flowchart TB
    subgraph Input["Raw Pollutants"]
        PM25[PM2.5]
        PM10[PM10]
        NO2[NO2]
        SO2[SO2]
        O3[O3]
        CO[CO]
    end

    subgraph Conversion["Unit Conversion"]
        CONV[Convert to ug/m3]
    end

    subgraph SubIndex["Sub-Index Calculation"]
        SI[Calculate Sub-Indices]
    end

    subgraph Final["Final AQI"]
        MAX[Max(Sub-Indices)]
        CAT[AQI Category]
    end

    PM25 --> CONV
    PM10 --> CONV
    NO2 --> CONV
    SO2 --> CONV
    O3 --> CONV
    CO --> CONV
    CONV --> SI --> MAX --> CAT
```

---

## 📁 Related Files

- [README.md](../README.md) - Main project documentation
- fastapi_app/app/services/ml_pipeline.py - ML pipeline code
- fastapi_app/app/services/prediction_service.py - Prediction service
