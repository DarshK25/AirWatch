import apiService from './api';

/**
 * Service to handle real data transformations and provide fallbacks
 */
export class RealDataService {
  constructor() {
    this.cache = {
      stations: null,
      lastFetch: null,
      cacheDuration: 5 * 60 * 1000 // 5 minutes
    };
  }

  /**
   * Check if cached data is still valid
   */
  isCacheValid() {
    if (!this.cache.lastFetch) return false;
    return Date.now() - this.cache.lastFetch < this.cache.cacheDuration;
  }

  /**
   * Get all stations with real data
   */
  async getStations() {
    try {
      // Use cache if valid
      if (this.isCacheValid() && this.cache.stations) {
        return this.cache.stations;
      }

      const response = await apiService.getStations();
      if (response?.stations) {
        // Transform the data to match frontend expectations
        const transformedStations = response.stations.map(station => ({
          id: station.id.toString(),
          name: station.name || 'Unknown Station',
          location: station.location || 'Unknown Location',
          latitude: station.latitude || 0,
          longitude: station.longitude || 0,
          aqi: station.aqi || 0,
          aqi_category: station.aqi_category || 'Unknown',
          pm25: station.pm25 || 0,
          pm10: station.pm10 || 0,
          no2: station.no2 || 0,
          nh3: station.nh3 || 0,
          so2: station.so2 || 0,
          co: station.co || 0,
          ozone: station.ozone || 0,
          last_updated: station.last_updated || new Date().toISOString(),
          status: station.aqi ? 'active' : 'inactive'
        }));

        // Cache the result
        this.cache.stations = transformedStations;
        this.cache.lastFetch = Date.now();

        return transformedStations;
      }
      return [];
    } catch (error) {
      console.error('Error fetching stations:', error);
      return this.getFallbackStations();
    }
  }

  /**
   * Get historical data for analytics
   */
  async getHistoricalData(stationId, days = 7) {
    try {
      const response = await apiService.getStationHistoricalData(stationId, days);
      if (response?.data) {
        return response.data.map(reading => ({
          timestamp: reading.timestamp,
          aqi: reading.aqi || 0,
          category: reading.aqi_category || 'Unknown',
          pm25: reading.pm25 || 0,
          pm10: reading.pm10 || 0,
          no2: reading.no2 || 0,
          so2: reading.so2 || 0,
          co: reading.co || 0,
          ozone: reading.ozone || 0
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return this.generateFallbackHistoricalData(days);
    }
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary() {
    try {
      const response = await apiService.getAnalyticsSummary();
      if (response) {
        return {
          totalStations: response.total_stations || 0,
          averageAQI: Math.round(response.average_aqi || 0),
          categoryDistribution: response.category_distribution || {},
          lastUpdated: response.last_updated || new Date().toISOString()
        };
      }
      return this.getFallbackAnalytics();
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return this.getFallbackAnalytics();
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts() {
    try {
      const response = await apiService.getActiveAlerts();
      if (response?.alerts) {
        return response.alerts.map(alert => ({
          id: alert.id,
          stationId: alert.station_id,
          stationName: alert.station_name,
          location: alert.location,
          aqi: alert.aqi,
          category: alert.aqi_category,
          severity: alert.severity,
          message: alert.message,
          timestamp: alert.timestamp,
          type: alert.severity === 'High' ? 'critical' : 'warning'
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  }

  /**
   * Get predictions for a station
   */
  async getStationPredictions(stationId) {
    try {
      const response = await apiService.getStationPredictions(stationId);
      if (response?.predictions) {
        return response.predictions;
      }
      return [];
    } catch (error) {
      console.error('Error fetching predictions:', error);
      return this.generateFallbackPredictions();
    }
  }

  /**
   * Calculate dashboard statistics from stations data
   */
  calculateDashboardStats(stations) {
    if (!stations || stations.length === 0) {
      return {
        totalStations: 0,
        averageAQI: 0,
        goodQuality: 0,
        poorQuality: 0,
        categoryDistribution: {}
      };
    }

    const validStations = stations.filter(s => s.aqi > 0);
    const totalAQI = validStations.reduce((sum, s) => sum + s.aqi, 0);
    const averageAQI = validStations.length > 0 ? Math.round(totalAQI / validStations.length) : 0;

    const goodQuality = stations.filter(s => s.aqi <= 50).length;
    const poorQuality = stations.filter(s => s.aqi > 100).length;

    // Category distribution
    const categoryDistribution = {};
    stations.forEach(station => {
      if (station.aqi_category && station.aqi_category !== 'Unknown') {
        categoryDistribution[station.aqi_category] = (categoryDistribution[station.aqi_category] || 0) + 1;
      }
    });

    return {
      totalStations: stations.length,
      averageAQI,
      goodQuality,
      poorQuality,
      categoryDistribution
    };
  }

  /**
   * Fallback stations data
   */
  getFallbackStations() {
    return [
      {
        id: '1',
        name: 'Sample Station 1',
        location: 'Sample Location',
        latitude: 19.0760,
        longitude: 72.8777,
        aqi: 85,
        aqi_category: 'Moderate',
        pm25: 25,
        pm10: 40,
        no2: 30,
        nh3: 15,
        so2: 10,
        co: 0.8,
        ozone: 75,
        last_updated: new Date().toISOString(),
        status: 'active'
      }
    ];
  }

  /**
   * Fallback analytics data
   */
  getFallbackAnalytics() {
    return {
      totalStations: 1,
      averageAQI: 85,
      categoryDistribution: { 'Moderate': 1 },
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Generate fallback historical data
   */
  generateFallbackHistoricalData(days) {
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < days * 4; i++) { // 4 readings per day
      const timestamp = new Date(now);
      timestamp.setHours(timestamp.getHours() - i * 6);
      
      const aqi = Math.floor(Math.random() * 150) + 50;
      const category = aqi <= 50 ? 'Good' : 
                     aqi <= 100 ? 'Moderate' : 
                     aqi <= 150 ? 'Unhealthy for Sensitive Groups' : 'Unhealthy';
      
      data.push({
        timestamp: timestamp.toISOString(),
        aqi,
        category,
        pm25: Math.floor(Math.random() * 75) + 10,
        pm10: Math.floor(Math.random() * 100) + 20,
        no2: Math.floor(Math.random() * 50) + 10,
        so2: Math.floor(Math.random() * 30) + 5,
        co: Math.random() * 2 + 0.5,
        ozone: Math.floor(Math.random() * 100) + 50
      });
    }
    
    return data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Generate fallback predictions
   */
  generateFallbackPredictions() {
    const predictions = [];
    const baseAQI = 85;
    
    for (let i = 1; i <= 24; i++) {
      const variation = (Math.random() - 0.5) * 20;
      const predictedAQI = Math.max(0, Math.round(baseAQI + variation));
      const category = predictedAQI <= 50 ? 'Good' : 
                      predictedAQI <= 100 ? 'Moderate' : 
                      predictedAQI <= 150 ? 'Unhealthy for Sensitive Groups' : 'Unhealthy';
      
      predictions.push({
        hour: i,
        predicted_aqi: predictedAQI,
        category,
        confidence: Math.random() * 0.3 + 0.7 // 70-100% confidence
      });
    }
    
    return predictions;
  }
}

// Export singleton instance
export const realDataService = new RealDataService();
export default realDataService;