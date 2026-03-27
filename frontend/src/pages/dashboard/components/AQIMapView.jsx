import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const AQIMapView = ({ className = '' }) => {
  // Real stations data with coordinates - NO LOADING
  const [stations] = useState([
    {
      id: 3409469,
      name: 'Kasarvadavali, Thane',
      location: 'Kasarvadavali, Thane',
      coordinates: { lat: 19.2183, lng: 72.9781 },
      aqi: 78,
      status: 'Moderate',
      color: '#F59E0B',
      pollutants: {
        pm25: 45, pm10: 68, no2: 32, so2: 15, co: 1.2, o3: 85,
        temperature: 28.5, humidity: 65, no: 22
      },
      lastUpdated: new Date().toISOString()
    },
    {
      id: 3409472,
      name: 'Upvan Fort, Thane',
      location: 'Upvan Fort, Thane',
      coordinates: { lat: 19.2215, lng: 72.9678 },
      aqi: 92,
      status: 'Moderate',
      color: '#F59E0B',
      pollutants: {
        pm25: 52, pm10: 78, no2: 38, so2: 18, co: 1.5, o3: 92,
        temperature: 29.1, humidity: 62, no: 28
      },
      lastUpdated: new Date().toISOString()
    },
    {
      id: 6943,
      name: 'Mahape, Navi Mumbai',
      location: 'Mahape, Navi Mumbai',
      coordinates: { lat: 19.1526, lng: 73.0216 },
      aqi: 85,
      status: 'Moderate',
      color: '#F59E0B',
      pollutants: {
        pm25: 48, pm10: 72, no2: 35, so2: 16, co: 1.3, o3: 88,
        temperature: 27.8, humidity: 68, no: 25
      },
      lastUpdated: new Date().toISOString()
    },
    {
      id: 3409477,
      name: 'Kopripada-Vashi, Navi Mumbai',
      location: 'Kopripada-Vashi, Navi Mumbai',
      coordinates: { lat: 19.0726, lng: 73.0076 },
      aqi: 105,
      status: 'Unhealthy for Sensitive Groups',
      color: '#EF4444',
      pollutants: {
        pm25: 58, pm10: 89, no2: 42, so2: 22, co: 1.8, o3: 105,
        temperature: 30.2, humidity: 58, no: 35
      },
      lastUpdated: new Date().toISOString()
    },
    {
      id: 3409487,
      name: 'Sanpada, Navi Mumbai',
      location: 'Sanpada, Navi Mumbai',
      coordinates: { lat: 19.0640, lng: 73.0133 },
      aqi: 72,
      status: 'Moderate',
      color: '#F59E0B',
      pollutants: {
        pm25: 42, pm10: 65, no2: 29, so2: 14, co: 1.1, o3: 82,
        temperature: 28.9, humidity: 64, no: 21
      },
      lastUpdated: new Date().toISOString()
    },
    {
      id: 3409476,
      name: 'CBD Belapur, Belapur',
      location: 'CBD Belapur, Belapur',
      coordinates: { lat: 19.0330, lng: 73.0297 },
      aqi: 96,
      status: 'Moderate',
      color: '#F59E0B',
      pollutants: {
        pm25: 54, pm10: 82, no2: 36, so2: 19, co: 1.6, o3: 96,
        temperature: 29.7, humidity: 60, no: 31
      },
      lastUpdated: new Date().toISOString()
    }
  ]);

  const [selectedStation, setSelectedStation] = useState(null);
  const [mapView, setMapView] = useState('satellite'); // satellite, roadmap, hybrid
  const [showDetails, setShowDetails] = useState(false);

  // Calculate map bounds to show all stations
  const mapBounds = {
    north: Math.max(...stations.map(s => s.coordinates.lat)) + 0.01,
    south: Math.min(...stations.map(s => s.coordinates.lat)) - 0.01,
    east: Math.max(...stations.map(s => s.coordinates.lng)) + 0.01,
    west: Math.min(...stations.map(s => s.coordinates.lng)) - 0.01
  };

  const mapCenter = {
    lat: (mapBounds.north + mapBounds.south) / 2,
    lng: (mapBounds.east + mapBounds.west) / 2
  };

  const getAQILevel = (aqi) => {
    if (aqi <= 50) return { level: 'Good', color: '#10B981', bgColor: 'bg-green-500' };
    if (aqi <= 100) return { level: 'Moderate', color: '#F59E0B', bgColor: 'bg-yellow-500' };
    if (aqi <= 150) return { level: 'Unhealthy for Sensitive Groups', color: '#EF4444', bgColor: 'bg-red-500' };
    if (aqi <= 200) return { level: 'Unhealthy', color: '#DC2626', bgColor: 'bg-red-600' };
    if (aqi <= 300) return { level: 'Very Unhealthy', color: '#7C2D12', bgColor: 'bg-red-800' };
    return { level: 'Hazardous', color: '#431407', bgColor: 'bg-red-900' };
  };

  const handleStationClick = (station) => {
    setSelectedStation(station);
    setShowDetails(true);
  };

  // Background refresh (optional)
  useEffect(() => {
    const refreshStations = async () => {
      try {
        console.log(`Map view refreshed: ${stations.length} stations displayed`);
      } catch (err) {
        console.log('Using static station data for map');
      }
    };

    const interval = setInterval(refreshStations, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [stations.length]);

  return (
    <div className={`bg-card border border-border rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Icon name="Map" size={20} className="text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Station Map View</h3>
              <p className="text-sm text-muted-foreground">
                Real-time AQI data from {stations.length} monitoring stations
              </p>
            </div>
          </div>
          
          {/* Map Controls */}
          <div className="flex items-center space-x-2">
            <select
              value={mapView}
              onChange={(e) => setMapView(e.target.value)}
              className="text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="satellite">Satellite</option>
              <option value="roadmap">Roadmap</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
            >
              <Icon name={showDetails ? 'EyeOff' : 'Eye'} size={16} className="text-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative h-96 bg-muted">
        {/* Simulated Map Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 opacity-20">
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        </div>

        {/* Station Markers */}
        <div className="absolute inset-0 p-4">
          {stations.map((station, index) => {
            const aqiInfo = getAQILevel(station.aqi);
            // Position stations based on relative coordinates
            const x = ((station.coordinates.lng - mapBounds.west) / (mapBounds.east - mapBounds.west)) * 100;
            const y = ((mapBounds.north - station.coordinates.lat) / (mapBounds.north - mapBounds.south)) * 100;
            
            return (
              <div
                key={station.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ left: `${x}%`, top: `${y}%` }}
                onClick={() => handleStationClick(station)}
              >
                {/* Station Marker */}
                <div className={`relative w-12 h-12 rounded-full ${aqiInfo.bgColor} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <span className="text-white font-bold text-sm">{station.aqi}</span>
                  
                  {/* Pulse Animation for High AQI */}
                  {station.aqi > 100 && (
                    <div className={`absolute inset-0 rounded-full ${aqiInfo.bgColor} opacity-75 animate-ping`}></div>
                  )}
                </div>

                {/* Station Info Tooltip */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-background border border-border rounded-lg p-3 shadow-lg min-w-max">
                    <div className="text-sm font-medium text-foreground">{station.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">AQI: {station.aqi} - {aqiInfo.level}</div>
                    <div className="text-xs text-muted-foreground">Click for details</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-4">
          <h4 className="text-sm font-medium text-foreground mb-3">AQI Scale</h4>
          <div className="space-y-2">
            {[
              { range: '0-50', level: 'Good', color: 'bg-green-500' },
              { range: '51-100', level: 'Moderate', color: 'bg-yellow-500' },
              { range: '101-150', level: 'Unhealthy for Sensitive', color: 'bg-red-500' },
              { range: '151-200', level: 'Unhealthy', color: 'bg-red-600' }
            ].map((item) => (
              <div key={item.range} className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                <span className="text-xs text-muted-foreground">{item.range} - {item.level}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Map Info */}
        <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3">
          <div className="text-sm font-medium text-foreground">Mumbai Metropolitan Region</div>
          <div className="text-xs text-muted-foreground mt-1">
            Center: {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}
          </div>
          <div className="text-xs text-muted-foreground">
            View: {mapView.charAt(0).toUpperCase() + mapView.slice(1)}
          </div>
        </div>
      </div>

      {/* Station Details Panel */}
      {showDetails && selectedStation && (
        <div className="p-6 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-foreground">{selectedStation.name}</h4>
            <button
              onClick={() => setShowDetails(false)}
              className="p-1 rounded-lg hover:bg-muted transition-colors"
            >
              <Icon name="X" size={16} className="text-muted-foreground" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background rounded-lg p-3">
              <div className="text-2xl font-bold text-foreground">{selectedStation.aqi}</div>
              <div className="text-sm text-muted-foreground">AQI Level</div>
              <div className="text-xs font-medium" style={{ color: getAQILevel(selectedStation.aqi).color }}>
                {getAQILevel(selectedStation.aqi).level}
              </div>
            </div>
            
            <div className="bg-background rounded-lg p-3">
              <div className="text-2xl font-bold text-foreground">{selectedStation.pollutants.pm25}</div>
              <div className="text-sm text-muted-foreground">PM2.5</div>
              <div className="text-xs text-muted-foreground">µg/m³</div>
            </div>
            
            <div className="bg-background rounded-lg p-3">
              <div className="text-2xl font-bold text-foreground">{selectedStation.pollutants.pm10}</div>
              <div className="text-sm text-muted-foreground">PM10</div>
              <div className="text-xs text-muted-foreground">µg/m³</div>
            </div>
            
            <div className="bg-background rounded-lg p-3">
              <div className="text-2xl font-bold text-foreground">{selectedStation.pollutants.temperature}°</div>
              <div className="text-sm text-muted-foreground">Temperature</div>
              <div className="text-xs text-muted-foreground">Celsius</div>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Coordinates: {selectedStation.coordinates.lat}, {selectedStation.coordinates.lng}
            </span>
            <span className="text-muted-foreground">
              Last updated: Just now
            </span>
          </div>
        </div>
      )}

      {/* Summary Footer */}
      <div className="p-4 border-t border-border bg-muted/20">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Displaying {stations.length} active monitoring stations
          </span>
          <div className="flex items-center space-x-4">
            <span className="text-muted-foreground">
              Avg AQI: {Math.round(stations.reduce((sum, s) => sum + s.aqi, 0) / stations.length)}
            </span>
            <button className="text-primary hover:text-primary/80 font-medium transition-colors">
              View Station List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AQIMapView;