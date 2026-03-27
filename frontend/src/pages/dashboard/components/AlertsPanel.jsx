import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';

const THRESHOLDS = {
  pm25: { warn: 60, critical: 90 },
  pm10: { warn: 100, critical: 150 },
  no2: { warn: 80, critical: 120 },
  o3: { warn: 100, critical: 140 },
  so2: { warn: 80, critical: 120 },
  co: { warn: 4000, critical: 8000 },
};

function buildAlerts(stations) {
  const alerts = [];

  stations.forEach((station) => {
    // AQI-level alert
    if (station.overall_aqi > 200) {
      alerts.push({
        id: `aqi-${station.id}`,
        stationId: station.id,
        stationName: station.name,
        severity: 'high',
        pollutant: 'AQI',
        value: station.overall_aqi,
        message: `AQI is ${station.overall_aqi} — ${station.aqi_category}`,
        color: station.aqi_color,
        timestamp: station.last_updated || new Date().toISOString(),
      });
    } else if (station.overall_aqi > 100) {
      alerts.push({
        id: `aqi-${station.id}`,
        stationId: station.id,
        stationName: station.name,
        severity: 'medium',
        pollutant: 'AQI',
        value: station.overall_aqi,
        message: `AQI is ${station.overall_aqi} — ${station.aqi_category}`,
        color: station.aqi_color,
        timestamp: station.last_updated || new Date().toISOString(),
      });
    }

    // Per-pollutant alerts
    Object.entries(station.pollutants || {}).forEach(([param, data]) => {
      const thresh = THRESHOLDS[param];
      if (!thresh) return;
      const val = data.ugm3_value ?? data.value ?? 0;
      if (val >= thresh.critical) {
        alerts.push({
          id: `${param}-${station.id}`,
          stationId: station.id,
          stationName: station.name,
          severity: 'high',
          pollutant: param.toUpperCase(),
          value: val,
          message: `${param.toUpperCase()} at ${val.toFixed(1)} µg/m³ — exceeds critical threshold (${thresh.critical})`,
          color: '#EF4444',
          timestamp: station.last_updated || new Date().toISOString(),
        });
      } else if (val >= thresh.warn) {
        alerts.push({
          id: `${param}-${station.id}`,
          stationId: station.id,
          stationName: station.name,
          severity: 'medium',
          pollutant: param.toUpperCase(),
          value: val,
          message: `${param.toUpperCase()} at ${val.toFixed(1)} µg/m³ — above warning threshold (${thresh.warn})`,
          color: '#F59E0B',
          timestamp: station.last_updated || new Date().toISOString(),
        });
      }
    });
  });

  // Sort: high first, then by station name
  return alerts.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });
}

const getTimeAgo = (ts) => {
  if (!ts) return '—';
  const diff = Math.floor((Date.now() - new Date(ts)) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
};

const severityStyle = {
  high: 'text-red-600 bg-red-50',
  medium: 'text-yellow-600 bg-yellow-50',
  low: 'text-green-600 bg-green-50',
};

const severityIcon = { high: 'AlertTriangle', medium: 'AlertCircle', low: 'Info' };

const AlertsPanel = ({ stations = [] }) => {
  const [filter, setFilter] = useState('all');
  const alerts = useMemo(() => buildAlerts(stations), [stations]);
  const filtered = filter === 'all' ? alerts : alerts.filter((a) => a.severity === filter);

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <Icon name="Bell" size={20} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Active Alerts</h3>
            <p className="text-sm text-muted-foreground">
              {alerts.length} threshold breach{alerts.length !== 1 ? 'es' : ''} across {stations.length} stations
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
          {['all', 'high', 'medium'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors capitalize ${
                filter === s ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="CheckCircle" size={48} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {alerts.length === 0 ? 'All stations within normal parameters' : 'No alerts match this filter'}
            </p>
          </div>
        ) : (
          filtered.map((alert) => (
            <div key={alert.id} className="flex items-start space-x-3 p-4 bg-background rounded-lg border border-border">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${severityStyle[alert.severity]}`}>
                <Icon name={severityIcon[alert.severity]} size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-foreground truncate">{alert.stationName}</p>
                  <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{getTimeAgo(alert.timestamp)}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${severityStyle[alert.severity]}`}>
                  {alert.severity.toUpperCase()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Showing {filtered.length} of {alerts.length} alerts</span>
      </div>
    </div>
  );
};

export default AlertsPanel;
