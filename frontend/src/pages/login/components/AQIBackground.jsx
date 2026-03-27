import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import { realDataService } from '../../../services/realDataService';

const AQIBackground = () => {
  const [currentAQI, setCurrentAQI] = useState({
    value: 68,
    status: 'moderate',
    location: 'Loading...',
    timestamp: new Date()
  });
  const [loading, setLoading] = useState(true);

  const aqiLevels = {
    good: {
      label: 'Good',
      color: 'text-aqi-good',
      bgGradient: 'from-aqi-good/20 to-aqi-good/5',
      icon: 'CheckCircle'
    },
    moderate: {
      label: 'Moderate',
      color: 'text-aqi-moderate',
      bgGradient: 'from-aqi-moderate/20 to-aqi-moderate/5',
      icon: 'AlertCircle'
    },
    'unhealthy-sensitive': {
      label: 'Unhealthy for Sensitive Groups',
      color: 'text-aqi-unhealthy-sensitive',
      bgGradient: 'from-aqi-unhealthy-sensitive/20 to-aqi-unhealthy-sensitive/5',
      icon: 'AlertTriangle'
    },
    unhealthy: {
      label: 'Unhealthy',
      color: 'text-aqi-unhealthy',
      bgGradient: 'from-aqi-unhealthy/20 to-aqi-unhealthy/5',
      icon: 'XCircle'
    }
  };

  const getAQIStatus = (value) => {
    if (value <= 50) return 'good';
    if (value <= 100) return 'moderate';
    if (value <= 150) return 'unhealthy-sensitive';
    return 'unhealthy';
  };

  // Fetch real station data and update AQI display
  useEffect(() => {
    const fetchAQIData = async () => {
      try {
        setLoading(true);
        const stations = await realDataService.getStations();
        
        if (stations && stations.length > 0) {
          // Pick a random station for the background display
          const randomStation = stations[Math.floor(Math.random() * stations.length)];
          const aqiValue = randomStation.current_aqi || 68;
          const status = getAQIStatus(aqiValue);
          
          setCurrentAQI({
            value: aqiValue,
            status,
            location: randomStation.name || 'Monitoring Station',
            timestamp: new Date(randomStation.last_updated || new Date())
          });
        }
      } catch (error) {
        console.error('Error fetching AQI data:', error);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    fetchAQIData();

    // Update with real data every 5 minutes
    const interval = setInterval(fetchAQIData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const currentLevel = aqiLevels?.[currentAQI?.status];
  const timeString = currentAQI?.timestamp?.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  });

  return (
    <div className={`
      absolute inset-0 bg-gradient-to-br ${currentLevel?.bgGradient}
      flex items-end justify-start p-8
    `}>
      {/* Floating AQI Indicator */}
      <div className="glass-card p-6 rounded-2xl max-w-sm">
        <div className="flex items-center space-x-3 mb-3">
          <div className={`
            flex items-center justify-center w-10 h-10 rounded-full
            ${currentLevel?.color?.replace('text-', 'bg-')}/20
          `}>
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            ) : (
              <Icon 
                name={currentLevel?.icon} 
                size={20} 
                className={currentLevel?.color}
              />
            )}
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-mono font-bold text-foreground">
                {loading ? '--' : currentAQI?.value}
              </span>
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                AQI
              </span>
            </div>
            <span className={`text-sm font-medium ${currentLevel?.color}`}>
              {loading ? 'Loading...' : currentLevel?.label}
            </span>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Icon name="MapPin" size={14} />
            <span>{currentAQI?.location}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Icon name="Clock" size={14} />
            <span>Updated at {timeString} IST</span>
          </div>
        </div>
      </div>
      {/* Decorative Elements */}
      <div className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-1/3 right-1/3 w-24 h-24 rounded-full bg-accent/5 blur-2xl" />
    </div>
  );
};

export default AQIBackground;