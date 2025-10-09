const API_BASE_URL = 'http://localhost:8000/api/aqi';

export const apiService = {
  // Get all stations with current data
  async getStationsWithDetails() {
    try {
      const response = await fetch(`${API_BASE_URL}/stations`);
      if (!response.ok) {
        throw new Error('Failed to fetch stations');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching stations:', error);
      throw error;
    }
  },

  // Get current AQI for a specific station
  async getCurrentAQI(stationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/stations/${stationId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch AQI for station ${stationId}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching AQI for station ${stationId}:`, error);
      throw error;
    }
  },

  // Get forecast for a specific station
  async getForecast(stationId, hours = 24) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/forecast/${stationId}?period=${hours}h`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch forecast for station ${stationId}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching forecast for station ${stationId}:`, error);
      throw error;
    }
  },

  // Get pollutant data for a specific station
  async getPollutants(stationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/pollutants/${stationId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch pollutants for station ${stationId}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching pollutants for station ${stationId}:`, error);
      throw error;
    }
  },

  // Get historical data for a specific station
  async getHistoricalData(stationId, startDate, endDate) {
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate
      });
      
      const response = await fetch(
        `${API_BASE_URL}/historical/${stationId}?${params.toString()}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch historical data for station ${stationId}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching historical data for station ${stationId}:`, error);
      throw error;
    }
  }
};
