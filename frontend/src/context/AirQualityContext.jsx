/**
 * AirQualityContext — global live data store.
 *
 * Fetches stations + realtime AQI on mount, then refreshes every 5 minutes.
 * All pages consume this instead of making their own fetch calls.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStations, getRealtimeAqi } from '../utils/api';

const AirQualityContext = createContext(null);

export function AirQualityProvider({ children }) {
  const [stations, setStations] = useState([]);
  const [aqiData, setAqiData] = useState([]);   // array of RealTimeAQISchema
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Merge stations + AQI into one enriched array
  const enrichedStations = stations.map((s) => {
    const aqi = aqiData.find((a) => a.station_id === s.id);
    return {
      ...s,
      overall_aqi: aqi?.overall_aqi ?? 0,
      aqi_category: aqi?.aqi_category ?? 'No Data',
      aqi_color: aqi?.aqi_color ?? '#cccccc',
      last_updated: aqi?.last_updated ?? null,
      pollutants: aqi?.pollutants ?? {},
    };
  });

  const averageAqi = enrichedStations.length
    ? Math.round(enrichedStations.reduce((s, x) => s + x.overall_aqi, 0) / enrichedStations.length)
    : 0;

  const refresh = useCallback(async () => {
    try {
      const [stationsRes, aqiRes] = await Promise.all([getStations(), getRealtimeAqi()]);
      setStations(stationsRes);
      setAqiData(aqiRes);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to fetch live data. Retrying…');
      console.error('[AirQuality] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5 * 60 * 1000); // every 5 min
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <AirQualityContext.Provider
      value={{ stations, aqiData, enrichedStations, averageAqi, loading, error, lastUpdated, refresh }}
    >
      {children}
    </AirQualityContext.Provider>
  );
}

export function useAirQuality() {
  const ctx = useContext(AirQualityContext);
  if (!ctx) throw new Error('useAirQuality must be used inside AirQualityProvider');
  return ctx;
}
