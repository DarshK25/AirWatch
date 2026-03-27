import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import Icon from '../../components/AppIcon';
import Header from '../../components/ui/Header';
import { useAirQuality } from '../../context/AirQualityContext';
import { getAqiHistory, getPredictions } from '../../utils/api';

const POLLUTANT_LABELS = {
  pm25: 'PM2.5', pm10: 'PM10', no2: 'NO₂', so2: 'SO₂',
  co: 'CO', o3: 'O₃', temperature: 'Temp', relativehumidity: 'Humidity', no: 'NO',
};

const getAQILevel = (aqi) => {
  if (aqi <= 50)  return { level: 'Good',                        color: '#10B981', bg: 'bg-green-500' };
  if (aqi <= 100) return { level: 'Satisfactory',                color: '#84CC16', bg: 'bg-lime-500' };
  if (aqi <= 200) return { level: 'Moderate',                    color: '#F59E0B', bg: 'bg-yellow-500' };
  if (aqi <= 300) return { level: 'Poor',                        color: '#F97316', bg: 'bg-orange-500' };
  if (aqi <= 400) return { level: 'Very Poor',                   color: '#EF4444', bg: 'bg-red-500' };
  return           { level: 'Severe',                            color: '#7C3AED', bg: 'bg-purple-600' };
};

const StationDetails = () => {
  const { id: stationId } = useParams();
  const navigate = useNavigate();
  const { enrichedStations, loading: globalLoading } = useAirQuality();

  const [activeTab, setActiveTab] = useState('overview');
  const [history, setHistory] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [historyHours, setHistoryHours] = useState(24);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [predictionsLoading, setPredictionsLoading] = useState(false);

  const station = enrichedStations.find((s) => String(s.id) === String(stationId));

  // Fetch history when tab or hours changes
  useEffect(() => {
    if (!stationId) return;
    setHistoryLoading(true);
    getAqiHistory(stationId, historyHours)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [stationId, historyHours]);

  // Fetch predictions when tab = trends
  useEffect(() => {
    if (!stationId) return;
    setPredictionsLoading(true);
    getPredictions(stationId)
      .then(setPredictions)
      .catch(() => setPredictions([]))
      .finally(() => setPredictionsLoading(false));
  }, [stationId]);

  if (globalLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!station) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 text-center">
          <p className="text-muted-foreground">Station not found.</p>
          <button onClick={handleBackToDashboard} className="mt-4 text-primary underline">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Navigate back
  const handleBackToDashboard = () => navigate('/dashboard');

  const aqiInfo = getAQILevel(station.overall_aqi);

  // Format history for chart
  const historyChartData = history.map((h) => ({
    time: new Date(h.datetime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
    AQI: h.overall_aqi,
    PM25: h.pollutants?.pm25 ?? null,
    PM10: h.pollutants?.pm10 ?? null,
    NO2: h.pollutants?.no2 ?? null,
  }));

  // Format predictions for chart
  const predChartData = predictions.slice(0, 48).map((p) => ({
    time: new Date(p.prediction_time).toLocaleString('en-IN', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
    }),
    'Predicted AQI': p.predicted_aqi,
  }));

  const tabs = [
    { id: 'overview',   name: 'Overview',         icon: 'BarChart3' },
    { id: 'pollutants', name: 'Pollutants',        icon: 'Activity' },
    { id: 'trends',     name: 'Historical Trends', icon: 'TrendingUp' },
    { id: 'forecast',   name: '48h Forecast',      icon: 'Clock' },
    { id: 'nearby',     name: 'Nearby Stations',   icon: 'MapPin' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center space-x-2 text-sm">
          <button onClick={handleBackToDashboard} className="text-muted-foreground hover:text-foreground">
            Dashboard
          </button>
          <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
          <span className="text-foreground font-medium">{station.name}</span>
        </nav>

        {/* Station Header */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-start space-x-4">
              <div className={`w-16 h-16 rounded-xl ${aqiInfo.bg} flex items-center justify-center flex-shrink-0`}>
                <span className="text-white font-bold text-xl">{station.overall_aqi}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-1">{station.name}</h1>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Icon name="MapPin" size={14} />
                    {station.lat?.toFixed(4)}, {station.lon?.toFixed(4)}
                  </span>
                  {station.last_updated && (
                    <span className="flex items-center gap-1">
                      <Icon name="Clock" size={14} />
                      {new Date(station.last_updated).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-foreground">{station.overall_aqi}</div>
              <div className="text-sm font-medium" style={{ color: aqiInfo.color }}>{aqiInfo.level}</div>
              <div className="text-xs text-muted-foreground">AQI</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-border">
          <nav className="flex space-x-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon name={tab.icon} size={16} />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Key Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(station.pollutants)
                  .filter(([k]) => ['pm25', 'pm10', 'no2', 'o3', 'temperature', 'relativehumidity'].includes(k))
                  .map(([key, data]) => {
                    const val = data.ugm3_value ?? data.value ?? 0;
                    return (
                      <div key={key} className="bg-background rounded-lg p-4">
                        <div className="text-sm font-medium text-foreground mb-1">
                          {POLLUTANT_LABELS[key] || key.toUpperCase()}
                        </div>
                        <div className="text-2xl font-bold text-foreground">{val.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">{data.unit}</div>
                        {data.sub_index != null && (
                          <div className="text-xs text-muted-foreground mt-1">Sub-index: {data.sub_index}</div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Station Info</h3>
                <div className="space-y-3 text-sm">
                  <div><span className="text-muted-foreground">Station ID</span><div className="font-medium">{station.id}</div></div>
                  <div><span className="text-muted-foreground">AQI Category</span><div className="font-medium" style={{ color: aqiInfo.color }}>{aqiInfo.level}</div></div>
                  <div><span className="text-muted-foreground">Pollutants tracked</span><div className="font-medium">{Object.keys(station.pollutants).length}</div></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Pollutants ── */}
        {activeTab === 'pollutants' && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">All Pollutant Readings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(station.pollutants).map(([key, data]) => {
                const val = data.ugm3_value ?? data.value ?? 0;
                const maxVal = key === 'temperature' ? 50 : key === 'relativehumidity' ? 100 : 200;
                const pct = Math.min(100, (val / maxVal) * 100);
                return (
                  <div key={key} className="bg-background rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground">{POLLUTANT_LABELS[key] || key.toUpperCase()}</h4>
                      {data.sub_index != null && (
                        <span className="text-xs bg-muted px-2 py-1 rounded-full">SI: {data.sub_index}</span>
                      )}
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">{val.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground mb-3">{data.unit}</div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Historical Trends ── */}
        {activeTab === 'trends' && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h3 className="text-lg font-semibold text-foreground">Historical AQI Trend</h3>
              <div className="flex gap-2">
                {[24, 72, 168, 720].map((h) => (
                  <button
                    key={h}
                    onClick={() => setHistoryHours(h)}
                    className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                      historyHours === h ? 'bg-primary text-white border-primary' : 'border-border hover:bg-muted'
                    }`}
                  >
                    {h === 24 ? '24h' : h === 72 ? '3d' : h === 168 ? '7d' : '30d'}
                  </button>
                ))}
              </div>
            </div>
            {historyLoading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : historyChartData.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-muted-foreground">No data for this period</div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={historyChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="AQI" stroke="#3B82F6" fill="url(#aqiGrad)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="PM25" stroke="#EF4444" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="PM10" stroke="#F59E0B" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {/* ── 48h Forecast ── */}
        {activeTab === 'forecast' && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">48-Hour AQI Forecast</h3>
            {predictionsLoading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : predChartData.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                No forecast available — predictions are generated from the latest data.
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={predChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={5} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="Predicted AQI" stroke="#8B5CF6" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-xl font-bold">{Math.round(predChartData.reduce((s, p) => s + p['Predicted AQI'], 0) / predChartData.length)}</div>
                    <div className="text-xs text-muted-foreground">Avg Predicted AQI</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-xl font-bold text-destructive">{Math.max(...predChartData.map((p) => p['Predicted AQI']))}</div>
                    <div className="text-xs text-muted-foreground">Peak</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-xl font-bold text-green-600">{Math.min(...predChartData.map((p) => p['Predicted AQI']))}</div>
                    <div className="text-xs text-muted-foreground">Lowest</div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Nearby Stations ── */}
        {activeTab === 'nearby' && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Other Monitoring Stations</h3>
            <div className="space-y-3">
              {enrichedStations
                .filter((s) => String(s.id) !== String(stationId))
                .map((s) => {
                  const info = getAQILevel(s.overall_aqi);
                  return (
                    <div
                      key={s.id}
                      onClick={() => navigate(`/station-details/${s.id}`)}
                      className="flex items-center justify-between p-4 bg-background rounded-lg cursor-pointer hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-lg ${info.bg} flex items-center justify-center`}>
                          <span className="text-white font-bold text-sm">{s.overall_aqi}</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{s.name}</h4>
                          <p className="text-sm text-muted-foreground">{s.lat?.toFixed(3)}, {s.lon?.toFixed(3)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm" style={{ color: info.color }}>{info.level}</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StationDetails;
