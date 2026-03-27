import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const StationMap = ({ station, nearbyStations }) => {
  const [mapView, setMapView] = useState('satellite');
  const [showNearbyStations, setShowNearbyStations] = useState(true);

  const mapViews = [
    { value: 'roadmap', label: 'Road', icon: 'Map' },
    { value: 'satellite', label: 'Satellite', icon: 'Satellite' },
    { value: 'hybrid', label: 'Hybrid', icon: 'Layers' }
  ];

  const getAQIMarkerColor = (aqi) => {
    if (aqi <= 50) return '#10B981';
    if (aqi <= 100) return '#F59E0B';
    if (aqi <= 150) return '#EF4444';
    if (aqi <= 200) return '#DC2626';
    if (aqi <= 300) return '#7C2D12';
    return '#450A0A';
  };

  // Generate map URL with markers for main station and nearby stations
  const generateMapUrl = () => {
    const baseUrl = 'https://www.google.com/maps/embed/v1/view';
    const apiKey = 'demo'; // In real app, use actual API key
    const center = `${station?.coordinates?.lat},${station?.coordinates?.lng}`;
    const zoom = 13;
    
    return `https://www.google.com/maps?q=${center}&z=${zoom}&t=${mapView}&output=embed`;
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-1">Station Location</h2>
          <p className="text-sm text-muted-foreground">
            Interactive map view with nearby monitoring stations
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Nearby Stations Toggle */}
          <button
            onClick={() => setShowNearbyStations(!showNearbyStations)}
            className={`
              flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-smooth
              ${showNearbyStations 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:text-foreground'
              }
            `}
          >
            <Icon name="MapPin" size={14} />
            <span>Nearby Stations</span>
          </button>

          {/* Map View Selector */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            {mapViews?.map((view) => (
              <button
                key={view?.value}
                onClick={() => setMapView(view?.value)}
                className={`
                  flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-smooth
                  ${mapView === view?.value 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <Icon name={view?.icon} size={12} />
                <span>{view?.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Map Container */}
      <div className="relative h-80 rounded-lg overflow-hidden border border-border">
        <iframe
          width="100%"
          height="100%"
          loading="lazy"
          title={`${station?.name} Location Map`}
          referrerPolicy="no-referrer-when-downgrade"
          src={generateMapUrl()}
          className="w-full h-full"
        />
        
        {/* Map Overlay Controls */}
        <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 border border-border">
          <div className="flex items-center space-x-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getAQIMarkerColor(station?.currentAQI?.value) }}
            />
            <span className="text-sm font-medium text-foreground">Current Station</span>
          </div>
          <div className="text-xs text-muted-foreground">
            AQI: {station?.currentAQI?.value} ({station?.currentAQI?.category})
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-1">
          <button className="w-8 h-8 bg-card/95 backdrop-blur-sm rounded border border-border flex items-center justify-center hover:bg-muted transition-smooth">
            <Icon name="Plus" size={14} />
          </button>
          <button className="w-8 h-8 bg-card/95 backdrop-blur-sm rounded border border-border flex items-center justify-center hover:bg-muted transition-smooth">
            <Icon name="Minus" size={14} />
          </button>
        </div>
      </div>
      {/* Station Information */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="font-medium text-foreground mb-3 flex items-center space-x-2">
            <Icon name="MapPin" size={16} />
            <span>Location Details</span>
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Coordinates:</span>
              <span className="font-mono text-foreground">
                {station?.coordinates?.lat}, {station?.coordinates?.lng}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Elevation:</span>
              <span className="text-foreground">{station?.elevation}m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Zone:</span>
              <span className="text-foreground">{station?.zone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Installation:</span>
              <span className="text-foreground">{station?.installationDate}</span>
            </div>
          </div>
        </div>

        {showNearbyStations && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium text-foreground mb-3 flex items-center space-x-2">
              <Icon name="Navigation" size={16} />
              <span>Nearby Stations</span>
            </h3>
            <div className="space-y-2">
              {nearbyStations?.slice(0, 4)?.map((nearby) => (
                <div key={nearby?.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getAQIMarkerColor(nearby?.aqi) }}
                    />
                    <span className="text-foreground">{nearby?.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground">{nearby?.distance}</div>
                    <div className="text-xs font-mono">AQI {nearby?.aqi}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-3 text-xs text-primary hover:text-primary/80 transition-smooth">
              View all nearby stations →
            </button>
          </div>
        )}
      </div>
      {/* Quick Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button className="flex items-center space-x-2 px-3 py-2 bg-muted/50 rounded-lg text-sm text-foreground hover:bg-muted transition-smooth">
          <Icon name="Navigation" size={14} />
          <span>Get Directions</span>
        </button>
        <button className="flex items-center space-x-2 px-3 py-2 bg-muted/50 rounded-lg text-sm text-foreground hover:bg-muted transition-smooth">
          <Icon name="Share" size={14} />
          <span>Share Location</span>
        </button>
        <button className="flex items-center space-x-2 px-3 py-2 bg-muted/50 rounded-lg text-sm text-foreground hover:bg-muted transition-smooth">
          <Icon name="Camera" size={14} />
          <span>Street View</span>
        </button>
      </div>
    </div>
  );
};

export default StationMap;