import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const AlertThresholdSlider = ({ 
  level, 
  color, 
  icon, 
  defaultValue = 50, 
  min = 0, 
  max = 500, 
  onChange,
  enabled = true,
  onToggle 
}) => {
  const [value, setValue] = useState(defaultValue);
  const [isEnabled, setIsEnabled] = useState(enabled);

  const handleSliderChange = (e) => {
    const newValue = parseInt(e?.target?.value);
    setValue(newValue);
    onChange && onChange(newValue);
  };

  const handleToggle = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    onToggle && onToggle(newEnabled);
  };

  const getSliderBackground = () => {
    const percentage = ((value - min) / (max - min)) * 100;
    return `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 transition-smooth">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center`} style={{ backgroundColor: `${color}20` }}>
            <Icon name={icon} size={20} style={{ color }} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{level}</h3>
            <p className="text-sm text-muted-foreground">AQI Threshold: {value}</p>
          </div>
        </div>
        
        <button
          onClick={handleToggle}
          className={`
            relative w-12 h-6 rounded-full transition-colors
            ${isEnabled ? 'bg-primary' : 'bg-muted-foreground/30'}
          `}
        >
          <div className={`
            absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform
            ${isEnabled ? 'translate-x-6' : 'translate-x-0.5'}
          `} />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Alert when AQI exceeds</span>
          <span className="font-mono font-medium text-foreground">{value}</span>
        </div>
        
        <div className="relative">
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={handleSliderChange}
            disabled={!isEnabled}
            className={`
              w-full h-2 rounded-lg appearance-none cursor-pointer
              ${!isEnabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            style={{
              background: isEnabled ? getSliderBackground() : '#e2e8f0'
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        </div>

        {isEnabled && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Icon name="Info" size={14} />
            <span>You'll receive alerts when AQI exceeds {value} at selected stations</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertThresholdSlider;