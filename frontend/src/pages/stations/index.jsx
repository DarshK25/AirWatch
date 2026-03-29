import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import { useAirQuality } from '../../context/AirQualityContext';

const StationList = () => {
  const navigate = useNavigate();
  const { enrichedStations, loading } = useAirQuality();

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return 'bg-green-500';
    if (aqi <= 100) return 'bg-yellow-500';
    if (aqi <= 150) return 'bg-orange-500';
    if (aqi <= 200) return 'bg-red-500';
    if (aqi <= 300) return 'bg-purple-500';
    return 'bg-purple-900';
  };

  const getAQILabel = (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Satisfactory';
    if (aqi <= 150) return 'Moderate';
    if (aqi <= 200) return 'Unhealthy for Sensitive';
    if (aqi <= 300) return 'Unhealthy';
    return 'Very Unhealthy';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center space-x-2 text-sm">
            <button onClick={() => navigate('/dashboard')} className="text-muted-foreground hover:text-foreground">
              Dashboard
            </button>
            <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
            <span className="text-foreground font-medium">Stations</span>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Monitoring Stations</h1>
            <p className="text-muted-foreground">
              Select a station to view detailed air quality data
            </p>
          </div>

          {/* Station Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrichedStations.map((station) => (
              <div
                key={station.id}
                onClick={() => navigate(`/station-details/${station.id}`)}
                className="bg-card border border-border rounded-xl p-6 cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-lg ${getAQIColor(station.currentAQI)} flex items-center justify-center`}>
                      <span className="text-white font-bold text-lg">{station.currentAQI}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{station.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {station.lat?.toFixed(4)}, {station.lon?.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <Icon name="ChevronRight" size={20} className="text-muted-foreground" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-sm font-medium ${getAQIColor(station.currentAQI).replace('bg-', 'text-')}`}>
                      {getAQILabel(station.currentAQI)}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">Click for details</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-xs text-muted-foreground">Live</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Station Details Preview */}
          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              Click on any station card to view detailed pollutant readings, historical trends, and 48-hour forecasts.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StationList;
