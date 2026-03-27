import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const StationHeader = ({ station }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getAQIColor = (status) => {
    const colors = {
      good: 'text-aqi-good',
      moderate: 'text-aqi-moderate',
      'unhealthy-sensitive': 'text-aqi-unhealthy-sensitive',
      unhealthy: 'text-aqi-unhealthy',
      'very-unhealthy': 'text-aqi-very-unhealthy',
      hazardous: 'text-aqi-hazardous'
    };
    return colors?.[status] || 'text-aqi-good';
  };

  const getAQIBgColor = (status) => {
    const colors = {
      good: 'bg-aqi-good/10',
      moderate: 'bg-aqi-moderate/10',
      'unhealthy-sensitive': 'bg-aqi-unhealthy-sensitive/10',
      unhealthy: 'bg-aqi-unhealthy/10',
      'very-unhealthy': 'bg-aqi-very-unhealthy/10',
      hazardous: 'bg-aqi-hazardous/10'
    };
    return colors?.[status] || 'bg-aqi-good/10';
  };

  const getStatusIcon = (status) => {
    const icons = {
      good: 'CheckCircle',
      moderate: 'AlertCircle',
      'unhealthy-sensitive': 'AlertTriangle',
      unhealthy: 'XCircle',
      'very-unhealthy': 'AlertOctagon',
      hazardous: 'Skull'
    };
    return icons?.[status] || 'CheckCircle';
  };

  const formatTime = (date) => {
    return date?.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
  };

  const formatDate = (date) => {
    return date?.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Station Info */}
        <div className="flex items-start space-x-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
            <Icon name="MapPin" size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">{station?.name}</h1>
            <p className="text-muted-foreground mb-2">{station?.location}</p>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span className="flex items-center space-x-1">
                <Icon name="MapPin" size={14} />
                <span>{station?.coordinates?.lat}, {station?.coordinates?.lng}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Icon name="Building" size={14} />
                <span>{station?.type}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Current AQI Display */}
        <div className={`
          flex items-center space-x-6 px-6 py-4 rounded-xl border
          ${getAQIBgColor(station?.currentAQI?.status)} border-opacity-20 aqi-breathing
        `}>
          <div className="text-center">
            <div className="text-4xl font-mono font-bold text-foreground mb-1">
              {station?.currentAQI?.value}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              AQI Index
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full
              ${getAQIColor(station?.currentAQI?.status)?.replace('text-', 'bg-')}/20
            `}>
              <Icon 
                name={getStatusIcon(station?.currentAQI?.status)} 
                size={20} 
                className={getAQIColor(station?.currentAQI?.status)}
              />
            </div>
            <div>
              <div className={`text-lg font-semibold ${getAQIColor(station?.currentAQI?.status)}`}>
                {station?.currentAQI?.category}
              </div>
              <div className="text-sm text-muted-foreground">
                {station?.currentAQI?.description}
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Status */}
        <div className="text-right">
          <div className="flex items-center justify-end space-x-2 mb-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-sm font-medium text-success">Live</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <div>{formatTime(currentTime)} IST</div>
            <div>{formatDate(currentTime)}</div>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Last updated: {station?.lastUpdated}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StationHeader;