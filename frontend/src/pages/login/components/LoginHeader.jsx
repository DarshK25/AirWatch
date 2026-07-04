import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import { realDataService } from '../../../services/realDataService';

const LoginHeader = () => {
  const [aqiValue, setAqiValue] = useState(null);
  const [aqiLabel, setAqiLabel] = useState('');
  const [aqiColor, setAqiColor] = useState('');

  useEffect(() => {
    realDataService.getStations().then((stations) => {
      if (stations?.length > 0) {
        const s = stations[Math.floor(Math.random() * stations.length)];
        const v = s.current_aqi || s.overall_aqi || s.currentAQI || 81;
        setAqiValue(v);
        if (v <= 50) { setAqiLabel('Good'); setAqiColor('#10B981'); }
        else if (v <= 100) { setAqiLabel('Satisfactory'); setAqiColor('#84CC16'); }
        else if (v <= 200) { setAqiLabel('Moderate'); setAqiColor('#F59E0B'); }
        else if (v <= 300) { setAqiLabel('Poor'); setAqiColor('#F97316'); }
        else if (v <= 400) { setAqiLabel('Very Poor'); setAqiColor('#EF4444'); }
        else { setAqiLabel('Severe'); setAqiColor('#7C3AED'); }
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="text-center mb-8">
      {/* Logo */}
      <div className="flex items-center justify-center space-x-3 mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary shadow-lg">
          <Icon name="Wind" size={24} color="white" />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-2xl font-bold text-foreground">AirWatch</span>
          <span className="text-sm text-primary font-semibold">Pro</span>
        </div>
      </div>

      {/* Welcome Text */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome Back
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Sign in to access real-time AQI monitoring and predictive analytics for industrial air quality management.
        </p>
      </div>

      {/* AQI Badge + Status */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-success/10 border border-success/20">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-sm font-medium text-success">System Online</span>
        </div>
        {aqiValue && (
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-background border border-border/50">
            <span className="text-sm font-bold" style={{ color: aqiColor }}>{aqiValue}</span>
            <span className="text-xs text-muted-foreground">AQI · {aqiLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginHeader;