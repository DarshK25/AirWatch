/**
 * api.js — single Axios instance for all backend calls.
 *
 * - Reads VITE_API_BASE_URL from .env
 * - Attaches Bearer token from localStorage on every request
 * - On 401 clears auth and redirects to /login
 */

import axios from 'axios';
import { getApiBaseUrl } from './env';

const BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 — clear session and redirect
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ---------------------------------------------------------------------------
// Stations
// ---------------------------------------------------------------------------
export const getStations = () =>
  api.get('/stations/').then((r) => r.data);

// ---------------------------------------------------------------------------
// Real-time AQI
// ---------------------------------------------------------------------------
export const getRealtimeAqi = () =>
  api.get('/aqi/realtime/').then((r) => r.data);

// ---------------------------------------------------------------------------
// Historical AQI  — hours: 1-8760
// ---------------------------------------------------------------------------
export const getAqiHistory = (stationId, hours = 24) =>
  api.get(`/aqi/history/${stationId}`, { params: { hours } }).then((r) => r.data);

// ---------------------------------------------------------------------------
// Predictions
// ---------------------------------------------------------------------------
export const getPredictions = (stationId, hours) =>
  api.get(`/predictions/${stationId}${hours ? `?hours=${hours}` : ''}`).then((r) => r.data);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const loginUser = (credentials) =>
  api.post('/auth/login', credentials).then((r) => r.data);

export const registerUser = (userData) =>
  api.post('/auth/register', userData).then((r) => r.data);

export const getCurrentUser = () =>
  api.get('/auth/me').then((r) => r.data);

// ---------------------------------------------------------------------------
// Scheduler (admin)
// ---------------------------------------------------------------------------
export const getSchedulerStatus = () =>
  api.get('/scheduler/status').then((r) => r.data);

export const triggerIngestion = () =>
  api.post('/scheduler/run/ingestion').then((r) => r.data);

export const triggerPredictions = () =>
  api.post('/scheduler/run/predictions').then((r) => r.data);

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
export const exportData = async (format = 'csv', stationIds = null) => {
  const stations = await getStations();
  const aqiData = await getRealtimeAqi();
  
  const stationIdsToExport = stationIds || stations.map(s => s.id);
  
  const exportRecords = [];
  
  for (const stationId of stationIdsToExport) {
    const station = stations.find(s => s.id === stationId);
    const aqi = aqiData.find(a => a.station_id === stationId);
    
    if (!station) continue;
    
    exportRecords.push({
      station_id: station.id,
      station_name: station.name,
      latitude: station.lat,
      longitude: station.lon,
      datetime: new Date().toISOString(),
      overall_aqi: aqi?.overall_aqi || 0,
      aqi_category: aqi?.aqi_category || 'Unknown',
      pm25: aqi?.pollutants?.pm25?.value || 0,
      pm10: aqi?.pollutants?.pm10?.value || 0,
      no2: aqi?.pollutants?.no2?.value || 0,
      so2: aqi?.pollutants?.so2?.value || 0,
      o3: aqi?.pollutants?.o3?.value || 0,
      co: aqi?.pollutants?.co?.value || 0,
    });
  }
  
  if (format === 'csv') {
    const headers = ['Station ID', 'Station Name', 'Latitude', 'Longitude', 'DateTime', 'AQI', 'Category', 'PM2.5', 'PM10', 'NO2', 'SO2', 'O3', 'CO'];
    const rows = exportRecords.map(r => [
      r.station_id, r.station_name, r.latitude, r.longitude, r.datetime,
      r.overall_aqi, r.aqi_category, r.pm25, r.pm10, r.no2, r.so2, r.o3, r.co
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
  
  return JSON.stringify({
    generated_at: new Date().toISOString(),
    data_source: 'AirWatch Pro',
    total_stations: exportRecords.length,
    records: exportRecords
  }, null, 2);
};

export default api;
