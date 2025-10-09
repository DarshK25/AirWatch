import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const Dashboard = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await apiService.getStationsWithDetails();
      setStations(response);
      setError(null);
    } catch (err) {
      setError('Failed to load station data');
      console.error('Error fetching stations:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAQIColor = (aqi) => {
    if (!aqi) return 'bg-gray-300';
    if (aqi <= 50) return 'bg-green-500';
    if (aqi <= 100) return 'bg-yellow-500';
    if (aqi <= 200) return 'bg-orange-500';
    if (aqi <= 300) return 'bg-red-500';
    if (aqi <= 400) return 'bg-purple-500';
    return 'bg-red-800';
  };

  const getAQICategory = (aqi) => {
    if (!aqi) return 'N/A';
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Satisfactory';
    if (aqi <= 200) return 'Moderate';
    if (aqi <= 300) return 'Poor';
    if (aqi <= 400) return 'Very Poor';
    return 'Severe';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading stations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ {error}</div>
          <button 
            onClick={fetchStations}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">AirWatch Pro</h1>
          <p className="text-gray-600 mt-2">Real-time Air Quality Monitoring - Thane-Belapur Region</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Stations</h3>
            <p className="text-2xl font-bold text-gray-900">{stations.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Average AQI</h3>
            <p className="text-2xl font-bold text-gray-900">
              {stations.length > 0 
                ? Math.round(stations.reduce((sum, s) => sum + (s.current_aqi || 0), 0) / stations.length)
                : 0
              }
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Good Quality</h3>
            <p className="text-2xl font-bold text-green-600">
              {stations.filter(s => (s.current_aqi || 0) <= 50).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Poor Quality</h3>
            <p className="text-2xl font-bold text-red-600">
              {stations.filter(s => (s.current_aqi || 0) > 200).length}
            </p>
          </div>
        </div>

        {/* Stations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stations.map((station) => (
            <div 
              key={station.location_id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/station/${station.location_id}`)}
            >
              <div className="p-6">
                {/* Station Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {station.station_name || station.name}
                  </h3>
                  <div 
                    className={`px-3 py-1 rounded-full text-white text-sm ${getAQIColor(station.current_aqi)}`}
                  >
                    {getAQICategory(station.current_aqi)}
                  </div>
                </div>

                {/* AQI Value */}
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-gray-900">
                    {station.current_aqi ? Math.round(station.current_aqi) : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">AQI</div>
                </div>

                {/* Pollutants */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">PM2.5:</span>
                    <span className="font-medium">{station.pollutants?.pm25 ? Math.round(station.pollutants.pm25) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">PM10:</span>
                    <span className="font-medium">{station.pollutants?.pm10 ? Math.round(station.pollutants.pm10) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">NO₂:</span>
                    <span className="font-medium">{station.pollutants?.no2 ? Math.round(station.pollutants.no2) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">O₃:</span>
                    <span className="font-medium">{station.pollutants?.o3 ? Math.round(station.pollutants.o3) : 'N/A'}</span>
                  </div>
                </div>

                {/* Last Updated */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Last updated: {station.last_updated ? new Date(station.last_updated).toLocaleString() : 'Unknown'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button 
            onClick={fetchStations}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
