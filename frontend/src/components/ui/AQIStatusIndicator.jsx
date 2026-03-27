import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';

const AQIStatusIndicator = ({ className = '', averageAqi = 42, aqiCategory = 'Good' }) => {
  const [currentAQI, setCurrentAQI] = useState({ 
    value: averageAqi || 42, 
    status: aqiCategory ? aqiCategory.toLowerCase().replace(/\s+/g, '-') : 'good',
    location: 'Corridor Average',
    lastUpdated: new Date()
  });

  const aqiLevels = {
    good: {
      label: 'Good',
      color: 'text-aqi-good',
      bgColor: 'bg-aqi-good/10',
      borderColor: 'border-aqi-good/20',
      icon: 'CheckCircle'
    },
    moderate: {
      label: 'Moderate',
      color: 'text-aqi-moderate',
      bgColor: 'bg-aqi-moderate/10',
      borderColor: 'border-aqi-moderate/20',
      icon: 'AlertCircle'
    },
    'unhealthy-sensitive': {
      label: 'Unhealthy for Sensitive Groups',
      color: 'text-aqi-unhealthy-sensitive',
      bgColor: 'bg-aqi-unhealthy-sensitive/10',
      borderColor: 'border-aqi-unhealthy-sensitive/20',
      icon: 'AlertTriangle'
    },
    unhealthy: {
      label: 'Unhealthy',
      color: 'text-aqi-unhealthy',
      bgColor: 'bg-aqi-unhealthy/10',
      borderColor: 'border-aqi-unhealthy/20',
      icon: 'XCircle'
    },
    'very-unhealthy': {
      label: 'Very Unhealthy',
      color: 'text-aqi-very-unhealthy',
      bgColor: 'bg-aqi-very-unhealthy/10',
      borderColor: 'border-aqi-very-unhealthy/20',
      icon: 'AlertOctagon'
    },
    hazardous: {
      label: 'Hazardous',
      color: 'text-aqi-hazardous',
      bgColor: 'bg-aqi-hazardous/10',
      borderColor: 'border-aqi-hazardous/20',
      icon: 'Skull'
    }
  };

  const getAQIStatus = (value) => {
    if (value <= 50) return 'good';
    if (value <= 100) return 'moderate';
    if (value <= 150) return 'unhealthy-sensitive';
    if (value <= 200) return 'unhealthy';
    if (value <= 300) return 'very-unhealthy';
    return 'hazardous';
  };

  // Update when props change
  useEffect(() => {
    if (averageAqi !== undefined) {
      const status = getAQIStatus(averageAqi);
      
      setCurrentAQI(prev => ({
        ...prev,
        value: averageAqi,
        status: aqiCategory ? aqiCategory.toLowerCase().replace(/\s+/g, '-') : status,
        lastUpdated: new Date()
      }));
    }
  }, [averageAqi, aqiCategory]);

  const currentLevel = aqiLevels?.[currentAQI?.status];
  const timeAgo = Math.floor((new Date() - currentAQI?.lastUpdated) / 1000 / 60);

  return (
    <div className={`
      flex items-center space-x-3 px-4 py-3 rounded-xl border transition-smooth
      ${currentLevel?.bgColor} ${currentLevel?.borderColor} aqi-breathing ${className}
    `}>
      {/* Status Icon */}
      <div className={`
        flex items-center justify-center w-8 h-8 rounded-full
        ${currentLevel?.color?.replace('text-', 'bg-')}/20
      `}>
        <Icon 
          name={currentLevel?.icon} 
          size={16} 
          className={currentLevel?.color}
        />
      </div>
      {/* AQI Information */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-mono font-semibold text-foreground">
            {currentAQI?.value}
          </span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            AQI
          </span>
        </div>
        
        <div className="flex items-center space-x-2 mt-1">
          <span className={`text-sm font-medium ${currentLevel?.color}`}>
            {currentLevel?.label}
          </span>
          <span className="text-xs text-muted-foreground">
            • {currentAQI?.location}
          </span>
        </div>
        
        <div className="text-xs text-muted-foreground mt-1">
          Updated {timeAgo === 0 ? 'just now' : `${timeAgo}m ago`}
        </div>
      </div>
      {/* Trend Indicator */}
      <div className="flex flex-col items-center space-y-1">
        <Icon 
          name="TrendingUp" 
          size={14} 
          className="text-muted-foreground"
        />
        <span className="text-xs text-muted-foreground">
          Live
        </span>
      </div>
    </div>
  );
};

export default AQIStatusIndicator;