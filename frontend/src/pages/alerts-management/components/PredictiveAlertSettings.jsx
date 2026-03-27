import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PredictiveAlertSettings = ({ onSave }) => {
  const [settings, setSettings] = useState({
    enabled: true,
    forecastHours: 24,
    confidenceThreshold: 75,
    alertLevels: {
      moderate: false,
      unhealthy: true,
      veryUnhealthy: true,
      hazardous: true
    },
    includeWeatherData: true,
    includeTrafficData: false,
    minimumDuration: 2
  });

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev?.[key]
    }));
  };

  const handleSliderChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: parseInt(value)
    }));
  };

  const handleAlertLevelChange = (level, enabled) => {
    setSettings(prev => ({
      ...prev,
      alertLevels: {
        ...prev?.alertLevels,
        [level]: enabled
      }
    }));
  };

  const handleSave = () => {
    onSave && onSave(settings);
  };

  const alertLevels = [
    { key: 'moderate', label: 'Moderate (101-150)', color: '#F59E0B' },
    { key: 'unhealthy', label: 'Unhealthy for Sensitive (151-200)', color: '#EF4444' },
    { key: 'veryUnhealthy', label: 'Very Unhealthy (201-300)', color: '#DC2626' },
    { key: 'hazardous', label: 'Hazardous (301+)', color: '#7C2D12' }
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon name="TrendingUp" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Predictive Alerts</h3>
            <p className="text-sm text-muted-foreground">AI-powered air quality forecasting</p>
          </div>
        </div>
        
        <button
          onClick={() => handleToggle('enabled')}
          className={`
            relative w-12 h-6 rounded-full transition-colors
            ${settings?.enabled ? 'bg-primary' : 'bg-muted-foreground/30'}
          `}
        >
          <div className={`
            absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform
            ${settings?.enabled ? 'translate-x-6' : 'translate-x-0.5'}
          `} />
        </button>
      </div>
      {settings?.enabled && (
        <div className="space-y-6">
          {/* Forecast Hours */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Forecast Window
              </label>
              <span className="text-sm font-mono text-primary">
                {settings?.forecastHours} hours
              </span>
            </div>
            <input
              type="range"
              min="12"
              max="48"
              step="6"
              value={settings?.forecastHours}
              onChange={(e) => handleSliderChange('forecastHours', e?.target?.value)}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #2563EB 0%, #2563EB ${((settings?.forecastHours - 12) / 36) * 100}%, #e2e8f0 ${((settings?.forecastHours - 12) / 36) * 100}%, #e2e8f0 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>12h</span>
              <span>24h</span>
              <span>36h</span>
              <span>48h</span>
            </div>
          </div>

          {/* Confidence Threshold */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Confidence Threshold
              </label>
              <span className="text-sm font-mono text-primary">
                {settings?.confidenceThreshold}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={settings?.confidenceThreshold}
              onChange={(e) => handleSliderChange('confidenceThreshold', e?.target?.value)}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #10B981 0%, #10B981 ${((settings?.confidenceThreshold - 50) / 45) * 100}%, #e2e8f0 ${((settings?.confidenceThreshold - 50) / 45) * 100}%, #e2e8f0 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>50%</span>
              <span>70%</span>
              <span>90%</span>
              <span>95%</span>
            </div>
          </div>

          {/* Alert Levels */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Alert for these AQI levels
            </label>
            <div className="space-y-2">
              {alertLevels?.map((level) => (
                <label key={level?.key} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={settings?.alertLevels?.[level?.key]}
                    onChange={(e) => handleAlertLevelChange(level?.key, e?.target?.checked)}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary/20"
                  />
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: level?.color }}
                    />
                    <span className="text-sm text-foreground">{level?.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Settings */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-foreground">Additional Data Sources</h4>
            
            <label className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Icon name="Cloud" size={16} className="text-muted-foreground" />
                <span className="text-sm text-foreground">Include weather data</span>
              </div>
              <button
                onClick={() => handleToggle('includeWeatherData')}
                className={`
                  relative w-10 h-5 rounded-full transition-colors
                  ${settings?.includeWeatherData ? 'bg-primary' : 'bg-muted-foreground/30'}
                `}
              >
                <div className={`
                  absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform
                  ${settings?.includeWeatherData ? 'translate-x-5' : 'translate-x-0.5'}
                `} />
              </button>
            </label>

            <label className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Icon name="Car" size={16} className="text-muted-foreground" />
                <span className="text-sm text-foreground">Include traffic data</span>
              </div>
              <button
                onClick={() => handleToggle('includeTrafficData')}
                className={`
                  relative w-10 h-5 rounded-full transition-colors
                  ${settings?.includeTrafficData ? 'bg-primary' : 'bg-muted-foreground/30'}
                `}
              >
                <div className={`
                  absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform
                  ${settings?.includeTrafficData ? 'translate-x-5' : 'translate-x-0.5'}
                `} />
              </button>
            </label>
          </div>

          {/* Minimum Duration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Minimum Alert Duration
              </label>
              <span className="text-sm font-mono text-primary">
                {settings?.minimumDuration} hours
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              step="1"
              value={settings?.minimumDuration}
              onChange={(e) => handleSliderChange('minimumDuration', e?.target?.value)}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #EF4444 0%, #EF4444 ${((settings?.minimumDuration - 1) / 5) * 100}%, #e2e8f0 ${((settings?.minimumDuration - 1) / 5) * 100}%, #e2e8f0 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1h</span>
              <span>3h</span>
              <span>6h</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Only alert if poor air quality is predicted to last at least this long
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} iconName="Save">
              Save Settings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictiveAlertSettings;