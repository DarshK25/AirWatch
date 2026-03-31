import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import AQIStationCard from './components/AQIStationCard';
import AQIStatusIndicator from '../../components/ui/AQIStatusIndicator';
import QuickActions from './components/QuickActions';
import AlertsPanel from './components/AlertsPanel';
import { useAirQuality } from '../../context/AirQualityContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { enrichedStations, averageAqi, loading, error, lastUpdated, refresh } = useAirQuality();

  const getAQICategory = (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Satisfactory';
    if (aqi <= 200) return 'Moderate';
    if (aqi <= 300) return 'Poor';
    if (aqi <= 400) return 'Very Poor';
    return 'Severe';
  };

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

          {/* Main Grid */}
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

          {/* Nav Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div
              onClick={() => navigate('/station-details/3409476')}
              className="bg-white border rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all group"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <div className="w-6 h-6 bg-blue-500 rounded" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Station Details</h3>
                  <p className="text-sm text-gray-600">Individual station analysis</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-mono font-bold text-gray-900">{enrichedStations.length}</span>
                <span className="text-gray-500 group-hover:text-blue-500 transition-colors">→</span>
              </div>
            </div>

            <div
              onClick={() => navigate('/historical-analytics')}
              className="bg-white border rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all group"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <div className="w-6 h-6 bg-green-500 rounded" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Historical Analytics</h3>
                  <p className="text-sm text-gray-600">Trends and predictions</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Real DB data</span>
                <span className="text-gray-500 group-hover:text-green-500 transition-colors">→</span>
              </div>
            </div>

            <div
              onClick={() => navigate('/alerts-management')}
              className="bg-white border rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all group"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <div className="w-6 h-6 bg-amber-500 rounded" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Alert Management</h3>
                  <p className="text-sm text-gray-600">Configure notifications</p>
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
