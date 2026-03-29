import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import AQIStationCard from './components/AQIStationCard';
import AQIStatusIndicator from '../../components/ui/AQIStatusIndicator';
import QuickActions from './components/QuickActions';
import AlertsPanel from './components/AlertsPanel';
import { useAirQuality } from '../../context/AirQualityContext';
import { getPredictions, getAqiHistory } from '../../utils/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';
import Icon from '../../components/AppIcon';

const Dashboard = () => {
  const navigate = useNavigate();
  const { enrichedStations, averageAqi, loading, error, lastUpdated, refresh } = useAirQuality();
  const [forecastData, setForecastData] = useState([]);
  const [loadingForecast, setLoadingForecast] = useState(true);
  const [selectedStation, setSelectedStation] = useState(6943);

  const getAQICategory = (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Satisfactory';
    if (aqi <= 150) return 'Moderate';
    if (aqi <= 200) return 'Poor';
    if (aqi <= 300) return 'Very Poor';
    return 'Severe';
  };

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#10B981';
    if (aqi <= 100) return '#84CC16';
    if (aqi <= 150) return '#F59E0B';
    if (aqi <= 200) return '#F97316';
    if (aqi <= 300) return '#EF4444';
    return '#7C3AED';
  };

  // Fetch forecast comparison data
  useEffect(() => {
    if (enrichedStations.length === 0) return;
    
    const fetchForecastData = async () => {
      setLoadingForecast(true);
      try {
        const station = enrichedStations.find(s => s.id === selectedStation) || enrichedStations[0];
        
        const [predictions, history] = await Promise.all([
          getPredictions(station.id),
          getAqiHistory(station.id, 24)
        ]);

        // Combine actual (historical) and predicted data
        const combined = [];
        
        // Add historical data (actual readings)
        history.forEach(h => {
          combined.push({
            time: new Date(h.datetime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
            datetime: new Date(h.datetime),
            actual: h.overall_aqi,
            predicted: null,
            type: 'actual'
          });
        });

        // Add predictions (future readings)
        const lastActualTime = history.length > 0 ? new Date(history[history.length - 1].datetime) : new Date();
        predictions.slice(0, 24).forEach(p => {
          const predTime = new Date(p.prediction_time);
          if (predTime > lastActualTime) {
            combined.push({
              time: predTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
              datetime: predTime,
              actual: null,
              predicted: p.predicted_aqi,
              type: 'predicted'
            });
          }
        });

        // Sort by time
        combined.sort((a, b) => a.datetime - b.datetime);
        setForecastData(combined);
      } catch (err) {
        console.error('Error fetching forecast data:', err);
      } finally {
        setLoadingForecast(false);
      }
    };

    fetchForecastData();
  }, [enrichedStations, selectedStation]);

  const currentStation = enrichedStations.find(s => s.id === selectedStation) || enrichedStations[0];
  const avgActual = forecastData.filter(d => d.actual).reduce((sum, d) => sum + d.actual, 0) / (forecastData.filter(d => d.actual).length || 1);
  const avgPredicted = forecastData.filter(d => d.predicted).reduce((sum, d) => sum + d.predicted, 0) / (forecastData.filter(d => d.predicted).length || 1);
  const predictionAccuracy = avgActual > 0 ? Math.max(0, Math.min(100, 100 - Math.abs(avgPredicted - avgActual) / avgActual * 100)) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">

          {/* Page Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Air Quality Monitoring Dashboard
              </h1>
              <p className="text-muted-foreground">
                Live data from {enrichedStations.length} monitoring stations
                {lastUpdated && (
                  <span> · Updated {lastUpdated.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                )}
              </p>
            </div>
            <button
              onClick={refresh}
              className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-muted transition-colors"
            >
              ↻ Refresh
            </button>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          {/* ====== FORECAST COMPARISON SECTION (PROMINENT) ====== */}
          <div className="mb-8 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Icon name="TrendingUp" size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">48-Hour AQI Forecast</h2>
                  <p className="text-purple-200 text-sm">ML-Powered Predictions vs Actual Readings</p>
                </div>
              </div>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(Number(e.target.value))}
                className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm"
              >
                {enrichedStations.map(s => (
                  <option key={s.id} value={s.id} className="text-gray-900">{s.name.split(' - ')[0]}</option>
                ))}
              </select>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-purple-200">Current AQI</span>
                </div>
                <div className="text-3xl font-bold">{currentStation?.currentAQI || 0}</div>
                <div className="text-sm text-purple-200">{currentStation?.aqi_category}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-purple-300 rounded-full"></div>
                  <span className="text-sm text-purple-200">24h Prediction</span>
                </div>
                <div className="text-3xl font-bold">{forecastData.filter(d => d.predicted).slice(23, 24)[0]?.predicted || '—'}</div>
                <div className="text-sm text-purple-200">
                  {forecastData.filter(d => d.predicted).length > 0 ? getAQICategory(forecastData.filter(d => d.predicted)[23]?.predicted) : 'N/A'}
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="Activity" size={14} className="text-green-400" />
                  <span className="text-sm text-purple-200">Avg Actual (24h)</span>
                </div>
                <div className="text-3xl font-bold">{Math.round(avgActual)}</div>
                <div className="text-sm text-purple-200">Real readings</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="Target" size={14} className="text-yellow-400" />
                  <span className="text-sm text-purple-200">Model Accuracy</span>
                </div>
                <div className="text-3xl font-bold">{Math.round(predictionAccuracy)}%</div>
                <div className="text-sm text-purple-200">Based on recent data</div>
              </div>
            </div>

            {/* Comparison Chart */}
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Actual vs Predicted AQI</span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-0.5 bg-green-400"></span> Actual (Solid)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-0.5 bg-purple-300" style={{ borderStyle: 'dashed', borderWidth: '1px', borderColor: '#c4b5fd' }}></span> Predicted (Dashed)
                  </span>
                </div>
              </div>
              {loadingForecast ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={forecastData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#c4b5fd' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: '#c4b5fd' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e1b4b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#4ade80" 
                      strokeWidth={3} 
                      dot={false} 
                      name="Actual AQI"
                      connectNulls={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="#c4b5fd" 
                      strokeWidth={3} 
                      strokeDasharray="8 4"
                      dot={false} 
                      name="Predicted AQI"
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* AQI Overview */}
          {!loading && (
            <div className="mb-8">
              <AQIStatusIndicator
                className="max-w-md"
                averageAqi={averageAqi}
                aqiCategory={getAQICategory(averageAqi)}
              />
            </div>
          )}

          {/* Main Grid - Stations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Monitoring Stations</h2>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {enrichedStations.map((station) => (
                    <AQIStationCard
                      key={station.id}
                      station={station}
                      onClick={() => navigate(`/station-details/${station.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <QuickActions />
            </div>
          </div>

          {/* Nav Cards - Updated to focus on forecast/analytics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div
              onClick={() => navigate('/stations')}
              className="bg-card border border-border rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all group"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon name="MapPin" size={24} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">All Stations</h3>
                  <p className="text-sm text-muted-foreground">View all monitoring stations</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-bold text-foreground">{enrichedStations.length}</span>
                <span className="text-gray-500 group-hover:text-blue-500 transition-colors">→</span>
              </div>
            </div>

            <div
              onClick={() => navigate('/historical-analytics')}
              className="bg-card border border-border rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all group"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon name="TrendingUp" size={24} className="text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Analytics</h3>
                  <p className="text-sm text-muted-foreground">Trends and detailed analysis</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-600 font-medium">ML Predictions</span>
                <span className="text-gray-500 group-hover:text-green-500 transition-colors">→</span>
              </div>
            </div>

            <div
              onClick={() => navigate('/alerts-management')}
              className="bg-card border border-border rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all group"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon name="Bell" size={24} className="text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Alert Management</h3>
                  <p className="text-sm text-muted-foreground">Configure notifications</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-600 font-medium">
                  {enrichedStations.filter((s) => s.overall_aqi > 100).length} active alerts
                </span>
                <span className="text-gray-500 group-hover:text-amber-500 transition-colors">→</span>
              </div>
            </div>
          </div>

          {/* Alerts Panel */}
          <AlertsPanel stations={enrichedStations} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
