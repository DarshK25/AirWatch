import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const StationDetail = () => {
  const { stationId } = useParams();
  const navigate = useNavigate();
  const [stationData, setStationData] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forecastHours, setForecastHours] = useState(24);

  useEffect(() => {
    if (stationId) {
      fetchStationData();
      fetchForecast();
    }
  }, [stationId, forecastHours]);

  const fetchStationData = async () => {
    try {
      const response = await apiService.getCurrentAQI(stationId);
      if (response.success && response.data) {
        setStationData(response.data);
        setError(null);
      } else {
        setStationData(null);
        setError(response.error || 'No station data available');
      }
    } catch (err) {
      console.error('Error in fetchStationData:', err);
      setError('Failed to load station data');
      setStationData(null);
    }
  };

  const fetchForecast = async () => {
    try {
      setLoading(true);
      await fetchStationData();
      
      const response = await apiService.getForecast(stationId, forecastHours);
      
      if (response.success && response.data) {
        const predictions = Array.isArray(response.data.predictions) 
          ? response.data.predictions 
          : [];
          
        const forecastData = {
          ...response.data,
          predictions: predictions,
          forecast: predictions,
          model_type: response.data.model_type || 'global',
          generated_at: response.data.generated_at || new Date().toISOString()
        };
        
        setForecast(forecastData);
        setError(null);
      } else {
        console.warn('No forecast data available in response');
        setForecast(null);
        setError(response?.error || 'No forecast data available');
      }
    } catch (err) {
      console.error('Error in fetchForecast:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load forecast data');
      setForecast(null);
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

  const getTextColor = (aqi) => {
    if (!aqi) return 'text-gray-600';
    if (aqi <= 50) return 'text-green-600';
    if (aqi <= 100) return 'text-yellow-600';
    if (aqi <= 200) return 'text-orange-600';
    if (aqi <= 300) return 'text-red-600';
    if (aqi <= 400) return 'text-purple-600';
    return 'text-red-900';
  };

  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString || 'N/A';
    }
  };
  
  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '--:--';
      
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return '--:--';
    }
  };

  if (loading && !stationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading station details...</p>
        </div>
      </div>
    );
  }

  if (error && !stationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ {error}</div>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
          >
            Back to Dashboard
          </button>
          <button 
            onClick={fetchStationData}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
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
          <div className="flex items-center justify-between">
            <div>
              <button 
                onClick={() => navigate('/')}
                className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900">
                {stationData?.station_name || forecast?.station_name || 'Station Details'}
              </h1>
              <p className="text-gray-600 mt-1">Station ID: {stationId}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Last Updated</div>
              <div className="text-sm font-medium">
                {stationData?.timestamp ? formatDateTime(stationData.timestamp) : 'Unknown'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Current Status */}
        {stationData && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Current Air Quality</h2>
              
              {/* Main AQI Display */}
              <div className="text-center mb-8">
                <div className={`inline-block px-8 py-6 rounded-lg border-2 ${getTextColor(stationData.current_aqi)}`}>
                  <div className="text-5xl font-bold mb-2">
                    {stationData.current_aqi ? Math.round(stationData.current_aqi) : 'N/A'}
                  </div>
                  <div className="text-lg font-medium">
                    {getAQICategory(stationData.current_aqi)}
                  </div>
                  <div className="text-sm opacity-75">AQI</div>
                </div>
              </div>

              {/* Pollutant Details */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {stationData.pollutants && Object.entries(stationData.pollutants).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-sm text-gray-500 uppercase mb-1">
                      {key === 'pm25' ? 'PM2.5' : key === 'pm10' ? 'PM10' : key.toUpperCase()}
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                      {value ? Math.round(value) : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {key.includes('pm') ? 'μg/m³' : 'ppb'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Meteorological Data */}
              {stationData.meteorological && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium mb-4">Weather Conditions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-sm text-blue-600 mb-1">Temperature</div>
                      <div className="text-xl font-bold text-blue-900">
                        {stationData.meteorological.temperature ? 
                          `${Math.round(stationData.meteorological.temperature)}°C` : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-sm text-blue-600 mb-1">Humidity</div>
                      <div className="text-xl font-bold text-blue-900">
                        {stationData.meteorological.relativehumidity ? 
                          `${Math.round(stationData.meteorological.relativehumidity)}%` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Forecast Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">AQI Forecast</h2>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Forecast Period:</label>
                <select 
                  value={forecastHours}
                  onChange={(e) => setForecastHours(parseInt(e.target.value))}
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value={24}>24 Hours</option>
                  <option value={72}>3 Days</option>
                  <option value={168}>7 Days</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading forecast...</p>
              </div>
            ) : forecast && forecast.predictions && forecast.predictions.length > 0 ? (
              <div>
                {/* Forecast Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-sm text-gray-500 mb-1">Average AQI</div>
                    <div className="text-xl font-bold">
                      {Math.round(forecast.predictions.reduce((sum, p) => sum + p.predicted_aqi, 0) / forecast.predictions.length)}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-sm text-gray-500 mb-1">Min AQI</div>
                    <div className="text-xl font-bold text-green-600">
                      {Math.round(Math.min(...forecast.predictions.map(p => p.predicted_aqi)))}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-sm text-gray-500 mb-1">Max AQI</div>
                    <div className="text-xl font-bold text-red-600">
                      {Math.round(Math.max(...forecast.predictions.map(p => p.predicted_aqi)))}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-sm text-gray-500 mb-1">Model</div>
                    <div className="text-sm font-medium capitalize">
                      {forecast.model_type}
                    </div>
                  </div>
                </div>

                {/* Forecast Timeline */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {forecastHours <= 24 ? (
                    // Hourly view for 24 hours
                    forecast.predictions.map((prediction, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="font-medium">
                            {formatDateTime(prediction.timestamp)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="font-bold text-lg">
                              {Math.round(prediction.predicted_aqi)}
                            </div>
                            <div className="text-xs text-gray-500">AQI</div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getAQIColor(prediction.predicted_aqi)}`}>
                            {getAQICategory(prediction.predicted_aqi)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Daily summary view for longer forecasts
                    (() => {
                      const dailyData = {};
                      forecast.predictions.forEach(pred => {
                        const date = new Date(pred.timestamp).toDateString();
                        if (!dailyData[date]) {
                          dailyData[date] = [];
                        }
                        dailyData[date].push(pred.predicted_aqi);
                      });

                      return Object.entries(dailyData).map(([date, aqiValues], index) => {
                        const avgAqi = Math.round(aqiValues.reduce((sum, aqi) => sum + aqi, 0) / aqiValues.length);
                        const minAqi = Math.round(Math.min(...aqiValues));
                        const maxAqi = Math.round(Math.max(...aqiValues));
                        
                        return (
                          <div key={index} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-lg">
                                {new Date(date).toLocaleDateString('en-IN', { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </div>
                              <div className={`px-3 py-1 rounded-full text-xs font-medium ${getAQIColor(avgAqi)}`}>
                                {getAQICategory(avgAqi)}
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div className="text-center">
                                <div className="text-xs text-gray-500">Average</div>
                                <div className="font-bold text-lg">{avgAqi}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-gray-500">Min</div>
                                <div className="font-bold text-green-600">{minAqi}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-gray-500">Max</div>
                                <div className="font-bold text-red-600">{maxAqi}</div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()
                  )}
                </div>

                <div className="mt-4 text-center text-sm text-gray-500">
                  {forecastHours <= 24 
                    ? `Showing ${forecast.predictions.length} hourly forecasts` 
                    : `Showing ${Math.ceil(forecast.predictions.length / 24)} day summary (${forecast.predictions.length} hours total)`}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {error || 'No forecast data available'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StationDetail;
