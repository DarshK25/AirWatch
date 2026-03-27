import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import Icon from '../../../components/AppIcon';

const PredictiveForecasting = ({ forecastData, modelMetrics }) => {
  const [selectedHours, setSelectedHours] = useState(24);
  const [showConfidenceInterval, setShowConfidenceInterval] = useState(true);

  const hourOptions = [
    { value: 24, label: '24 Hours' },
    { value: 48, label: '48 Hours' }
  ];

  const currentForecast = forecastData?.[`${selectedHours}h`] || [];

  const formatTooltipValue = (value, name) => {
    if (name === 'confidence_upper' || name === 'confidence_lower') {
      return [`${value} AQI`, `${name?.replace('_', ' ')?.replace(/\b\w/g, l => l?.toUpperCase())}`];
    }
    return [`${value} AQI`, 'Predicted AQI'];
  };

  const formatXAxisLabel = (tickItem) => {
    const date = new Date(tickItem);
    return date?.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    });
  };

  const getAQIStatus = (value) => {
    if (value <= 50) return { status: 'Good', color: '#10B981' };
    if (value <= 100) return { status: 'Moderate', color: '#F59E0B' };
    if (value <= 150) return { status: 'Unhealthy for Sensitive', color: '#EF4444' };
    if (value <= 200) return { status: 'Unhealthy', color: '#DC2626' };
    if (value <= 300) return { status: 'Very Unhealthy', color: '#7C2D12' };
    return { status: 'Hazardous', color: '#450A0A' };
  };

  const getMetricColor = (metric, value) => {
    const thresholds = {
      mae: { good: 10, moderate: 20 },
      rmse: { good: 15, moderate: 30 },
      r2: { good: 0.8, moderate: 0.6 }
    };

    if (metric === 'r2') {
      if (value >= thresholds?.r2?.good) return 'text-aqi-good';
      if (value >= thresholds?.r2?.moderate) return 'text-aqi-moderate';
      return 'text-aqi-unhealthy';
    } else {
      if (value <= thresholds?.[metric]?.good) return 'text-aqi-good';
      if (value <= thresholds?.[metric]?.moderate) return 'text-aqi-moderate';
      return 'text-aqi-unhealthy';
    }
  };

  const getNextAlertTime = () => {
    const alertThreshold = 100; // Moderate AQI threshold
    const alertPoint = currentForecast?.find(point => point?.predicted > alertThreshold);
    
    if (alertPoint) {
      const alertTime = new Date(alertPoint.timestamp);
      const now = new Date();
      const hoursUntil = Math.ceil((alertTime - now) / (1000 * 60 * 60));
      return { time: alertTime, hoursUntil, aqi: alertPoint?.predicted };
    }
    return null;
  };

  const nextAlert = getNextAlertTime();

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-1">Predictive Forecasting</h2>
          <p className="text-sm text-muted-foreground">
            AI-powered AQI predictions with confidence intervals
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Confidence Interval Toggle */}
          <button
            onClick={() => setShowConfidenceInterval(!showConfidenceInterval)}
            className={`
              flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-smooth
              ${showConfidenceInterval 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:text-foreground'
              }
            `}
          >
            <Icon name="TrendingUp" size={14} />
            <span>Confidence Bands</span>
          </button>

          {/* Time Range Selector */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            {hourOptions?.map((option) => (
              <button
                key={option?.value}
                onClick={() => setSelectedHours(option?.value)}
                className={`
                  px-3 py-1.5 rounded-md text-sm font-medium transition-smooth
                  ${selectedHours === option?.value 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                {option?.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Model Accuracy Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Mean Absolute Error</span>
            <Icon name="Target" size={16} className="text-muted-foreground" />
          </div>
          <div className={`text-2xl font-bold ${getMetricColor('mae', modelMetrics?.mae)}`}>
            {modelMetrics?.mae?.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Lower is better</p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Root Mean Square Error</span>
            <Icon name="Activity" size={16} className="text-muted-foreground" />
          </div>
          <div className={`text-2xl font-bold ${getMetricColor('rmse', modelMetrics?.rmse)}`}>
            {modelMetrics?.rmse?.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Prediction accuracy</p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">R² Score</span>
            <Icon name="TrendingUp" size={16} className="text-muted-foreground" />
          </div>
          <div className={`text-2xl font-bold ${getMetricColor('r2', modelMetrics?.r2)}`}>
            {(modelMetrics?.r2 * 100)?.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">Model fit quality</p>
        </div>
      </div>
      {/* Alert Prediction */}
      {nextAlert && (
        <div className="bg-aqi-moderate/10 border border-aqi-moderate/20 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-aqi-moderate/20">
              <Icon name="AlertTriangle" size={16} className="text-aqi-moderate" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Upcoming Air Quality Alert</h3>
              <p className="text-sm text-muted-foreground mb-2">
                AQI is predicted to reach <span className="font-medium text-aqi-moderate">{nextAlert?.aqi}</span> 
                {' '}({getAQIStatus(nextAlert?.aqi)?.status}) in approximately{' '}
                <span className="font-medium">{nextAlert?.hoursUntil} hours</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Expected time: {nextAlert?.time?.toLocaleString('en-IN', { 
                  timeZone: 'Asia/Kolkata',
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })} IST
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Forecast Chart */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={currentForecast} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxisLabel}
              stroke="var(--color-muted-foreground)"
              fontSize={12}
            />
            <YAxis 
              stroke="var(--color-muted-foreground)"
              fontSize={12}
            />
            <Tooltip 
              formatter={formatTooltipValue}
              labelFormatter={(label) => `Time: ${formatXAxisLabel(label)}`}
              contentStyle={{
                backgroundColor: 'var(--color-popover)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-foreground)'
              }}
            />
            
            {/* AQI Threshold Lines */}
            <ReferenceLine y={50} stroke="#10B981" strokeDasharray="5 5" label="Good" />
            <ReferenceLine y={100} stroke="#F59E0B" strokeDasharray="5 5" label="Moderate" />
            <ReferenceLine y={150} stroke="#EF4444" strokeDasharray="5 5" label="Unhealthy" />

            {/* Confidence Interval */}
            {showConfidenceInterval && (
              <>
                <Line
                  type="monotone"
                  dataKey="confidence_upper"
                  stroke="#94A3B8"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="confidence_lower"
                  stroke="#94A3B8"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                />
              </>
            )}

            {/* Main Prediction Line */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#2563EB"
              strokeWidth={3}
              dot={{ fill: '#2563EB', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#2563EB', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Forecast Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {currentForecast?.slice(0, 4)?.map((point, index) => {
          const status = getAQIStatus(point?.predicted);
          const timeFromNow = index * (selectedHours / 4);
          
          return (
            <div key={index} className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">
                +{timeFromNow?.toFixed(0)}h
              </div>
              <div className="text-lg font-bold text-foreground mb-1">
                {Math.round(point?.predicted)} AQI
              </div>
              <div 
                className="text-xs font-medium"
                style={{ color: status?.color }}
              >
                {status?.status}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ±{Math.round(point?.confidence_upper - point?.predicted)} AQI
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PredictiveForecasting;