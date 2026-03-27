import React from 'react';
import Icon from '../../../components/AppIcon';

const PollutantBreakdown = ({ pollutants }) => {
  const getPollutantStatus = (value, threshold) => {
    const ratio = value / threshold;
    if (ratio <= 0.5) return { status: 'good', color: 'text-aqi-good', bg: 'bg-aqi-good/10' };
    if (ratio <= 0.8) return { status: 'moderate', color: 'text-aqi-moderate', bg: 'bg-aqi-moderate/10' };
    if (ratio <= 1.0) return { status: 'unhealthy-sensitive', color: 'text-aqi-unhealthy-sensitive', bg: 'bg-aqi-unhealthy-sensitive/10' };
    if (ratio <= 1.5) return { status: 'unhealthy', color: 'text-aqi-unhealthy', bg: 'bg-aqi-unhealthy/10' };
    return { status: 'hazardous', color: 'text-aqi-hazardous', bg: 'bg-aqi-hazardous/10' };
  };

  const getHealthImpact = (pollutant, status) => {
    const impacts = {
      'PM2.5': {
        good: 'Minimal respiratory impact',
        moderate: 'Slight respiratory irritation possible',
        'unhealthy-sensitive': 'Sensitive groups may experience symptoms',
        unhealthy: 'Respiratory symptoms likely',
        hazardous: 'Serious respiratory health risks'
      },
      'PM10': {
        good: 'No significant health effects',
        moderate: 'Minor throat irritation possible',
        'unhealthy-sensitive': 'Coughing in sensitive individuals',
        unhealthy: 'Breathing difficulties possible',
        hazardous: 'Severe respiratory distress risk'
      },
      'NO2': {
        good: 'No adverse effects expected',
        moderate: 'Minimal impact on lung function',
        'unhealthy-sensitive': 'Asthma symptoms may worsen',
        unhealthy: 'Increased respiratory infections',
        hazardous: 'Severe lung inflammation risk'
      },
      'SO2': {
        good: 'Safe for all populations',
        moderate: 'Slight throat irritation',
        'unhealthy-sensitive': 'Bronchial constriction possible',
        unhealthy: 'Breathing difficulties',
        hazardous: 'Severe respiratory complications'
      },
      'O3': {
        good: 'No health concerns',
        moderate: 'Minor eye irritation',
        'unhealthy-sensitive': 'Chest tightness in sensitive groups',
        unhealthy: 'Reduced lung function',
        hazardous: 'Severe respiratory damage risk'
      }
    };
    return impacts?.[pollutant]?.[status] || 'Health impact assessment unavailable';
  };

  const getPollutantIcon = (pollutant) => {
    const icons = {
      'PM2.5': 'Droplets',
      'PM10': 'Cloud',
      'NO2': 'Car',
      'SO2': 'Factory',
      'O3': 'Sun'
    };
    return icons?.[pollutant] || 'AlertCircle';
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Pollutant Breakdown</h2>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Icon name="Activity" size={16} />
          <span>Real-time readings</span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {pollutants?.map((pollutant) => {
          const status = getPollutantStatus(pollutant?.current, pollutant?.threshold);
          const healthImpact = getHealthImpact(pollutant?.name, status?.status);
          const percentage = Math.min((pollutant?.current / pollutant?.threshold) * 100, 100);

          return (
            <div key={pollutant?.name} className={`
              p-4 rounded-lg border transition-smooth hover:shadow-md
              ${status?.bg} border-opacity-20
            `}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-lg
                    ${status?.color?.replace('text-', 'bg-')}/20
                  `}>
                    <Icon 
                      name={getPollutantIcon(pollutant?.name)} 
                      size={16} 
                      className={status?.color}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{pollutant?.name}</h3>
                    <p className="text-xs text-muted-foreground">{pollutant?.fullName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono font-semibold text-foreground">
                    {pollutant?.current}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {pollutant?.unit}
                  </div>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Current Level</span>
                  <span>Threshold: {pollutant?.threshold} {pollutant?.unit}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${status?.color?.replace('text-', 'bg-')}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className={status?.color}>
                    {percentage?.toFixed(1)}% of threshold
                  </span>
                  <span className="text-muted-foreground">
                    {pollutant?.trend > 0 ? '↗' : pollutant?.trend < 0 ? '↘' : '→'} {Math.abs(pollutant?.trend)}%
                  </span>
                </div>
              </div>
              {/* Health Impact */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Icon name="Heart" size={14} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-foreground mb-1">Health Impact</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {healthImpact}
                    </p>
                  </div>
                </div>
              </div>
              {/* 24h Range */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">24h Low</p>
                  <p className="text-sm font-medium text-foreground">{pollutant?.range24h?.min}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">24h High</p>
                  <p className="text-sm font-medium text-foreground">{pollutant?.range24h?.max}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Average</p>
                  <p className="text-sm font-medium text-foreground">{pollutant?.range24h?.avg}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PollutantBreakdown;