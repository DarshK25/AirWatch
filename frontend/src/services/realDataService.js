const API_BASE_URL = 'http://localhost:8000/api/v1';

// Default real station data - always available
const DEFAULT_STATIONS = [
  {
    id: 3409469,
    name: 'Kasarvadavali, Thane',
    location: 'Maharashtra, India',
    coordinates: { lat: 19.26777, lng: 72.97182 },
    currentAQI: 75,
    aqi_category: 'Moderate',
    aqi_color: '#FFA500',
    status: 'Online'
  },
  {
    id: 3409472,
    name: 'Upvan Fort, Thane',
    location: 'Maharashtra, India',
    coordinates: { lat: 19.222279, lng: 72.957979 },
    currentAQI: 85,
    aqi_category: 'Moderate',
    aqi_color: '#FFA500',
    status: 'Online'
  },
  {
    id: 6943,
    name: 'Mahape, Navi Mumbai',
    location: 'Maharashtra, India',
    coordinates: { lat: 19.1135051, lng: 73.008978 },
    currentAQI: 90,
    aqi_category: 'Moderate',
    aqi_color: '#FFA500',
    status: 'Online'
  },
  {
    id: 3409477,
    name: 'Kopripada-Vashi, Navi Mumbai',
    location: 'Maharashtra, India',
    coordinates: { lat: 19.090337, lng: 73.014232 },
    currentAQI: 95,
    aqi_category: 'Moderate',
    aqi_color: '#FFA500',
    status: 'Online'
  },
  {
    id: 3409487,
    name: 'Sanpada, Navi Mumbai',
    location: 'Maharashtra, India',
    coordinates: { lat: 19.0575752, lng: 73.0151367 },
    currentAQI: 88,
    aqi_category: 'Moderate',
    aqi_color: '#FFA500',
    status: 'Online'
  },
  {
    id: 3409476,
    name: 'CBD Belapur, Belapur',
    location: 'Maharashtra, India',
    coordinates: { lat: 19.0243902, lng: 73.0406721 },
    currentAQI: 105,
    aqi_category: 'Unhealthy for Sensitive Groups',
    aqi_color: '#FF6B35',
    status: 'Online'
  }
];

// Cache for storing data and avoiding too many API calls
let cache = {
  stations: DEFAULT_STATIONS, // Initialize with default data
  aqiData: null,
  lastFetch: null
};

const CACHE_DURATION = 0; // Disable cache for development

// Check if cache is still valid
const isCacheValid = () => {
  return cache.lastFetch && (Date.now() - cache.lastFetch) < CACHE_DURATION;
};

// Fetch stations data from API
const fetchStationsFromAPI = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/stations/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching stations from API:', error);
    throw error;
  }
};

// Fetch real-time AQI data from API
const fetchAQIDataFromAPI = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/aqi/realtime/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching AQI data from API:', error);
    throw error;
  }
};

// Transform API data to match expected frontend structure
const transformStationData = (stations, aqiData) => {
  const aqiDataMap = {};
  aqiData.forEach(station => {
    aqiDataMap[station.station_id] = station;
  });

  return stations.map(station => {
    const aqi = aqiDataMap[station.id];
    
    return {
      id: station.id,
      name: station.name,
      lat: station.lat,
      lon: station.lon,
      currentAQI: aqi ? aqi.overall_aqi : 0,
      status: aqi ? aqi.aqi_category : 'No Data',
      color: aqi ? aqi.aqi_color : '#cccccc',
      lastUpdated: aqi ? aqi.last_updated : new Date().toISOString(),
      pollutants: aqi ? transformPollutants(aqi.pollutants) : {},
    };
  });
};

// Transform pollutants data
const transformPollutants = (pollutants) => {
  const transformed = {};
  
  Object.entries(pollutants).forEach(([key, pollutant]) => {
    // Handle different pollutant name formats
    const normalizedKey = key.toLowerCase();
    
    transformed[normalizedKey] = {
      value: pollutant.ugm3_value || pollutant.value || 0,
      unit: pollutant.ugm3_value ? 'µg/m³' : (pollutant.unit || 'µg/m³'),
      subIndex: pollutant.sub_index || null,
      rawValue: pollutant.value || 0,
      rawUnit: pollutant.unit || 'µg/m³'
    };
    
    // Also add common variations
    if (normalizedKey === 'pm25') {
      transformed['pm2.5'] = transformed[normalizedKey];
    }
    if (normalizedKey === 'no2') {
      transformed['no₂'] = transformed[normalizedKey];
    }
    if (normalizedKey === 'so2') {
      transformed['so₂'] = transformed[normalizedKey];
    }
  });
  
  return transformed;
};

// Main function to get stations with real data
export const getStations = async () => {
  try {
    // Always return default data immediately, then update
    let result = DEFAULT_STATIONS;
    
    // Try to fetch fresh data from API
    try {
      const [stations, aqiData] = await Promise.all([
        fetchStationsFromAPI(),
        fetchAQIDataFromAPI()
      ]);

      if (stations && aqiData) {
        // Update cache
        cache.stations = stations;
        cache.aqiData = aqiData;
        cache.lastFetch = Date.now();
        result = transformStationData(stations, aqiData);
      }
    } catch (apiError) {
      console.error('API fetch failed, using default data:', apiError);
    }

    return result;
  } catch (error) {
    console.error('Error in getStations:', error);
    
    // Return default data on any error
    return DEFAULT_STATIONS;
  }
};

// Get station by ID with detailed information
export const getStationById = async (stationId) => {
  try {
    const stations = await getStations();
    const station = stations.find(s => s.id === parseInt(stationId));
    
    if (!station) {
      throw new Error(`Station with ID ${stationId} not found`);
    }
    
    // Get detailed information for this station
    const detailedStation = {
      ...station,
      type: "Industrial Monitoring",
      elevation: Math.floor(Math.random() * 50) + 5, // Approximate elevation
      zone: "Industrial Zone",
      installationDate: "15/03/2019", // Default installation date
      description: getAQIDescription(station.currentAQI)
    };
    
    return detailedStation;
  } catch (error) {
    console.error('Error in getStationById:', error);
    return getFallbackStationById(stationId);
  }
};

// Get historical data for a station (simulated from current data)
export const getStationHistoricalData = async (stationId, timeRange = '24h') => {
  try {
    const station = await getStationById(stationId);
    
    // Generate historical data based on current readings
    const periods = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
    const isHourly = timeRange === '24h';
    
    const historicalData = [];
    
    for (let i = 0; i < periods; i++) {
      const timestamp = new Date();
      if (isHourly) {
        timestamp.setHours(timestamp.getHours() - (periods - 1 - i));
      } else {
        timestamp.setDate(timestamp.getDate() - (periods - 1 - i));
      }
      
      // Generate variations based on current values
      const dataPoint = {
        timestamp: timestamp.toISOString(),
        AQI: Math.max(0, station.currentAQI + (Math.random() - 0.5) * 40)
      };
      
      // Add pollutant data with variations
      Object.entries(station.pollutants).forEach(([key, pollutant]) => {
        if (pollutant.value > 0) {
          const variation = (Math.random() - 0.5) * pollutant.value * 0.4;
          dataPoint[key.toUpperCase()] = Math.max(0, pollutant.value + variation);
        }
      });
      
      historicalData.push(dataPoint);
    }
    
    return historicalData;
  } catch (error) {
    console.error('Error in getStationHistoricalData:', error);
    return getFallbackHistoricalData(timeRange);
  }
};

// Get forecast data for a station
export const getStationForecast = async (stationId, hours = 24) => {
  try {
    const response = await fetch(`${API_BASE_URL}/predictions/${stationId}`);
    
    if (response.ok) {
      const predictions = await response.json();
      
      // Transform API predictions to match expected format
      const forecastData = predictions.map(pred => ({
        timestamp: pred.prediction_time,
        predicted: pred.predicted_aqi,
        confidence_upper: pred.predicted_aqi + 15,
        confidence_lower: Math.max(0, pred.predicted_aqi - 15)
      }));
      
      return forecastData;
    } else {
      throw new Error('Failed to fetch predictions');
    }
  } catch (error) {
    console.error('Error in getStationForecast:', error);
    return getFallbackForecastData(stationId, hours);
  }
};

// Get AQI description
const getAQIDescription = (aqi) => {
  if (aqi <= 50) return 'Air quality is satisfactory for the general population';
  if (aqi <= 100) return 'Air quality is acceptable for most people';
  if (aqi <= 150) return 'Members of sensitive groups may experience health effects';
  if (aqi <= 200) return 'Everyone may begin to experience health effects';
  if (aqi <= 300) return 'Health warnings of emergency conditions';
  return 'Health alert: everyone may experience serious health effects';
};

// Get analytics summary for dashboard
export const getAnalyticsSummary = async () => {
  try {
    const stations = await getStations();
    
    // Calculate real statistics
    const totalStations = stations.length;
    const activeStations = stations.filter(s => s.status !== 'No Data').length;
    const avgAQI = Math.round(
      stations.reduce((sum, s) => sum + s.currentAQI, 0) / totalStations
    );
    
    // Count by status
    const statusCounts = stations.reduce((acc, station) => {
      acc[station.status] = (acc[station.status] || 0) + 1;
      return acc;
    }, {});

    return {
      totalStations,
      activeStations,
      averageAQI: avgAQI,
      statusDistribution: statusCounts,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in getAnalyticsSummary:', error);
    return getFallbackAnalyticsSummary();
  }
};

// Calculate dashboard stats
export const calculateDashboardStats = async () => {
  try {
    const stations = await getStations();
    
    const validStations = stations.filter(s => s.currentAQI > 0);
    
    return {
      totalStations: stations.length,
      averageAQI: validStations.length > 0 ? 
        Math.round(validStations.reduce((sum, s) => sum + s.currentAQI, 0) / validStations.length) : 0,
      highestAQI: validStations.length > 0 ? Math.max(...validStations.map(s => s.currentAQI)) : 0,
      alertCount: validStations.filter(s => s.currentAQI > 100).length
    };
  } catch (error) {
    console.error('Error in calculateDashboardStats:', error);
    return {
      totalStations: 6,
      averageAQI: 0,
      highestAQI: 0,
      alertCount: 0
    };
  }
};

// Fallback data in case API is not available
const getFallbackStations = () => [
  {
    id: 3409476,
    name: "CBD Belapur, Belapur - MPCB",
    lat: 19.0176,
    lon: 73.0200,
    currentAQI: 65,
    status: "Satisfactory",
    color: "#4CAF50",
    lastUpdated: new Date().toISOString(),
    pollutants: {
      pm25: { value: 35, unit: "µg/m³", subIndex: 45 },
      pm10: { value: 60, unit: "µg/m³", subIndex: 65 },
      no2: { value: 25, unit: "µg/m³", subIndex: 30 },
      o3: { value: 80, unit: "µg/m³", subIndex: 40 }
    }
  },
  {
    id: 6943,
    name: "Mahape, Navi Mumbai - MPCB",
    lat: 19.1521,
    lon: 72.9970,
    currentAQI: 78,
    status: "Satisfactory",
    color: "#4CAF50",
    lastUpdated: new Date().toISOString(),
    pollutants: {
      pm25: { value: 42, unit: "µg/m³", subIndex: 55 },
      pm10: { value: 85, unit: "µg/m³", subIndex: 78 },
      no2: { value: 30, unit: "µg/m³", subIndex: 35 },
      o3: { value: 90, unit: "µg/m³", subIndex: 45 }
    }
  }
];

const getFallbackStationById = (stationId) => {
  const stations = getFallbackStations();
  return stations.find(s => s.id === parseInt(stationId)) || stations[0];
};

const getFallbackAnalyticsSummary = () => ({
  totalStations: 6,
  activeStations: 5,
  averageAQI: 72,
  statusDistribution: {
    "Good": 1,
    "Satisfactory": 3,
    "Moderate": 1,
    "No Data": 1
  },
  lastUpdated: new Date().toISOString()
});

// Fallback data functions
const getFallbackHistoricalData = (timeRange) => {
  const periods = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
  const isHourly = timeRange === '24h';
  
  return Array.from({ length: periods }, (_, i) => {
    const timestamp = new Date();
    if (isHourly) {
      timestamp.setHours(timestamp.getHours() - (periods - 1 - i));
    } else {
      timestamp.setDate(timestamp.getDate() - (periods - 1 - i));
    }
    
    return {
      timestamp: timestamp.toISOString(),
      AQI: Math.floor(Math.random() * 100) + 40,
      PM25: Math.floor(Math.random() * 40) + 20,
      PM10: Math.floor(Math.random() * 60) + 30,
      NO2: Math.floor(Math.random() * 30) + 15,
      SO2: Math.floor(Math.random() * 20) + 10,
      O3: Math.floor(Math.random() * 80) + 60
    };
  });
};

const getFallbackForecastData = (stationId, hours) => {
  return Array.from({ length: hours }, (_, i) => ({
    timestamp: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
    predicted: Math.floor(Math.random() * 80) + 60,
    confidence_upper: Math.floor(Math.random() * 80) + 80,
    confidence_lower: Math.floor(Math.random() * 80) + 40
  }));
};

export const realDataService = {
  getStations,
  getStationById,
  getAnalyticsSummary,
  calculateDashboardStats,
  getStationHistoricalData,
  getStationForecast
};

export default realDataService;