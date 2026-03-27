import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const StationAlertToggle = ({ 
  station, 
  enabled = false, 
  customThreshold = null,
  onToggle,
  onThresholdChange 
}) => {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [hasCustomThreshold, setHasCustomThreshold] = useState(!!customThreshold);
  const [threshold, setThreshold] = useState(customThreshold || 100);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleToggle = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    onToggle && onToggle(station?.id, newEnabled);
  };

  const handleCustomThresholdToggle = () => {
    const newHasCustom = !hasCustomThreshold;
    setHasCustomThreshold(newHasCustom);
    if (!newHasCustom) {
      setShowCustomInput(false);
    }
    onThresholdChange && onThresholdChange(station?.id, newHasCustom ? threshold : null);
  };

  const handleThresholdChange = (e) => {
    const newThreshold = parseInt(e?.target?.value);
    setThreshold(newThreshold);
    onThresholdChange && onThresholdChange(station?.id, newThreshold);
  };

  const getAQIStatusColor = (aqi) => {
    if (aqi <= 50) return 'text-aqi-good';
    if (aqi <= 100) return 'text-aqi-moderate';
    if (aqi <= 150) return 'text-aqi-unhealthy-sensitive';
    if (aqi <= 200) return 'text-aqi-unhealthy';
    if (aqi <= 300) return 'text-aqi-very-unhealthy';
    return 'text-aqi-hazardous';
  };

  const getAQIStatusBg = (aqi) => {
    if (aqi <= 50) return 'bg-aqi-good/10';
    if (aqi <= 100) return 'bg-aqi-moderate/10';
    if (aqi <= 150) return 'bg-aqi-unhealthy-sensitive/10';
    if (aqi <= 200) return 'bg-aqi-unhealthy/10';
    if (aqi <= 300) return 'bg-aqi-very-unhealthy/10';
    return 'bg-aqi-hazardous/10';
  };

  return (
    <div className={`
      bg-card border border-border rounded-xl p-4 transition-smooth
      ${isEnabled ? 'ring-2 ring-primary/20' : ''}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Icon name="MapPin" size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground truncate">{station?.name}</h4>
              <p className="text-sm text-muted-foreground">{station?.location}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 mb-3">
            <div className={`
              flex items-center space-x-2 px-2 py-1 rounded-lg
              ${getAQIStatusBg(station?.currentAQI)}
            `}>
              <span className="text-xs font-mono font-medium text-foreground">
                AQI {station?.currentAQI}
              </span>
              <span className={`text-xs font-medium ${getAQIStatusColor(station?.currentAQI)}`}>
                {station?.status}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Updated {station?.lastUpdated}
            </div>
          </div>

          {isEnabled && (
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Custom threshold</span>
                <button
                  onClick={handleCustomThresholdToggle}
                  className={`
                    relative w-10 h-5 rounded-full transition-colors
                    ${hasCustomThreshold ? 'bg-primary' : 'bg-muted-foreground/30'}
                  `}
                >
                  <div className={`
                    absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform
                    ${hasCustomThreshold ? 'translate-x-5' : 'translate-x-0.5'}
                  `} />
                </button>
              </div>

              {hasCustomThreshold && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="500"
                      value={threshold}
                      onChange={handleThresholdChange}
                      className="w-20 px-2 py-1 text-sm border border-border rounded bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="text-sm text-muted-foreground">AQI units</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Override global threshold for this station
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleToggle}
          className={`
            relative w-12 h-6 rounded-full transition-colors ml-4
            ${isEnabled ? 'bg-primary' : 'bg-muted-foreground/30'}
          `}
        >
          <div className={`
            absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform
            ${isEnabled ? 'translate-x-6' : 'translate-x-0.5'}
          `} />
        </button>
      </div>
    </div>
  );
};

export default StationAlertToggle;