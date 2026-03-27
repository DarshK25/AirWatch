import React, { useState, useEffect } from 'react';

const AQIBackground = ({ children }) => {
  const [currentAQI, setCurrentAQI] = useState({ value: 42, status: 'good' });

  const aqiThemes = {
    good: {
      primary: 'from-emerald-50 to-green-50',
      secondary: 'from-emerald-100/50 to-green-100/50',
      accent: 'bg-emerald-500/10'
    },
    moderate: {
      primary: 'from-yellow-50 to-amber-50',
      secondary: 'from-yellow-100/50 to-amber-100/50',
      accent: 'bg-yellow-500/10'
    },
    'unhealthy-sensitive': {
      primary: 'from-orange-50 to-red-50',
      secondary: 'from-orange-100/50 to-red-100/50',
      accent: 'bg-orange-500/10'
    },
    unhealthy: {
      primary: 'from-red-50 to-red-100',
      secondary: 'from-red-100/50 to-red-200/50',
      accent: 'bg-red-500/10'
    },
    'very-unhealthy': {
      primary: 'from-red-100 to-red-200',
      secondary: 'from-red-200/50 to-red-300/50',
      accent: 'bg-red-600/10'
    },
    hazardous: {
      primary: 'from-red-200 to-red-300',
      secondary: 'from-red-300/50 to-red-400/50',
      accent: 'bg-red-700/10'
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

  // Simulate AQI changes for dynamic theming
  useEffect(() => {
    const interval = setInterval(() => {
      const values = [35, 68, 125, 180];
      const randomValue = values?.[Math.floor(Math.random() * values?.length)];
      const status = getAQIStatus(randomValue);
      setCurrentAQI({ value: randomValue, status });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const currentTheme = aqiThemes?.[currentAQI?.status];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme?.primary} relative overflow-hidden`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Primary Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-tr ${currentTheme?.secondary} opacity-60`} />
        
        {/* Floating Particles */}
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-white/10 blur-xl animate-pulse" />
        <div className="absolute top-40 right-20 w-24 h-24 rounded-full bg-white/5 blur-lg animate-pulse delay-1000" />
        <div className="absolute bottom-32 left-1/4 w-40 h-40 rounded-full bg-white/5 blur-2xl animate-pulse delay-2000" />
        <div className="absolute bottom-20 right-1/3 w-28 h-28 rounded-full bg-white/10 blur-xl animate-pulse delay-3000" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }} />
        </div>
      </div>
      {/* Content Container */}
      <div className="relative z-10">
        {children}
      </div>
      {/* AQI Status Indicator */}
      <div className="absolute top-6 right-6 z-20">
        <div className={`
          flex items-center space-x-2 px-3 py-2 rounded-full backdrop-blur-sm
          ${currentTheme?.accent} border border-white/20
        `}>
          <div className={`w-2 h-2 rounded-full ${
            currentAQI?.status === 'good' ? 'bg-green-500' :
            currentAQI?.status === 'moderate' ? 'bg-yellow-500' :
            currentAQI?.status === 'unhealthy-sensitive' ? 'bg-orange-500' :
            currentAQI?.status === 'unhealthy' ? 'bg-red-500' :
            currentAQI?.status === 'very-unhealthy' ? 'bg-red-600' : 'bg-red-700'
          } animate-pulse`} />
          <span className="text-sm font-mono font-medium text-foreground/80">
            AQI {currentAQI?.value}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AQIBackground;