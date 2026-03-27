/**
 * api.js — single Axios instance for all backend calls.
 *
 * - Reads VITE_API_BASE_URL from .env
 * - Attaches Bearer token from localStorage on every request
 * - On 401 clears auth and redirects to /login
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

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
export const getPredictions = (stationId) =>
  api.get(`/predictions/${stationId}`).then((r) => r.data);

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

export default api;
