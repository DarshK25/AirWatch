# AirWatch Pro Release Notes

## Features

### Real-time Monitoring
- Live AQI data from 6 MPCB monitoring stations
- Pollutant readings: PM2.5, PM10, NO2, SO2, O3, CO
- Sub-hourly data updates via OpenAQ API

### ML Predictions
- 48-hour AQI forecasts using XGBoost
- Automatic daily model retraining
- Feature engineering with temporal and lagged features

### Dashboard
- React-based interactive UI
- Recharts visualizations
- Responsive design with TailwindCSS

### Alerts
- Configurable threshold alerts
- Station-specific notifications
- Severity-based categorization

## Infrastructure

### CI/CD
- GitHub Actions workflow
- Automated testing
- Docker builds
- Security scanning

### Deployment
- Docker & Docker Compose
- Railway deployment ready
- Vercel frontend hosting

## Security

- JWT authentication
- Input validation
- SQL injection prevention
- XSS protection
- Security headers

## Bug Fixes

See Git commit history for detailed fixes.
