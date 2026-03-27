import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import Icon from '../../../components/AppIcon';


const HistoricalChart = ({ data, pollutants }) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedPollutants, setSelectedPollutants] = useState(['AQI', 'PM2.5', 'PM10']);
  const [chartType, setChartType] = useState('line');

  const timeRanges = [
    { value: '24h', label: '24 Hours', data: data?.last24h },
    { value: '7d', label: '7 Days', data: data?.last7d },
    { value: '30d', label: '30 Days', data: data?.last30d }
  ];

  const pollutantColors = {
    AQI: '#2563EB',
    'PM2.5': '#DC2626',
    'PM10': '#D97706',
    'NO2': '#7C3AED',
    'SO2': '#059669',
    'O3': '#DB2777'
  };

  const currentData = timeRanges?.find(range => range?.value === selectedTimeRange)?.data || [];

  const togglePollutant = (pollutant) => {
    setSelectedPollutants(prev => 
      prev?.includes(pollutant) 
        ? prev?.filter(p => p !== pollutant)
        : [...prev, pollutant]
    );
  };

  const formatTooltipValue = (value, name) => {
    const unit = name === 'AQI' ? '' : pollutants?.find(p => p?.name === name)?.unit || 'μg/m³';
    return [`${value} ${unit}`, name];
  };

  const formatXAxisLabel = (tickItem) => {
    const date = new Date(tickItem);
    if (selectedTimeRange === '24h') {
      return date?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } else if (selectedTimeRange === '7d') {
      return date?.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } else {
      return date?.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    }
  };

  const getAQIZones = () => {
    return [
      { value: 50, color: '#10B981', label: 'Good' },
      { value: 100, color: '#F59E0B', label: 'Moderate' },
      { value: 150, color: '#EF4444', label: 'Unhealthy for Sensitive' },
      { value: 200, color: '#DC2626', label: 'Unhealthy' },
      { value: 300, color: '#7C2D12', label: 'Very Unhealthy' }
    ];
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-1">Historical Data Analysis</h2>
          <p className="text-sm text-muted-foreground">
            Interactive visualization of pollutant trends over time
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Chart Type Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <button
              onClick={() => setChartType('line')}
              className={`
                px-3 py-1.5 rounded-md text-sm font-medium transition-smooth
                ${chartType === 'line' ?'bg-primary text-primary-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <Icon name="TrendingUp" size={16} className="mr-1" />
              Line
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`
                px-3 py-1.5 rounded-md text-sm font-medium transition-smooth
                ${chartType === 'area' ?'bg-primary text-primary-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <Icon name="BarChart3" size={16} className="mr-1" />
              Area
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            {timeRanges?.map((range) => (
              <button
                key={range?.value}
                onClick={() => setSelectedTimeRange(range?.value)}
                className={`
                  px-3 py-1.5 rounded-md text-sm font-medium transition-smooth
                  ${selectedTimeRange === range?.value 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                {range?.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Pollutant Selector */}
      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-muted/50 rounded-lg">
        <span className="text-sm font-medium text-foreground mr-2">Show:</span>
        {Object.keys(pollutantColors)?.map((pollutant) => (
          <button
            key={pollutant}
            onClick={() => togglePollutant(pollutant)}
            className={`
              flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium transition-smooth
              ${selectedPollutants?.includes(pollutant)
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
              }
            `}
          >
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: pollutantColors?.[pollutant] }}
            />
            <span>{pollutant}</span>
          </button>
        ))}
      </div>
      {/* Chart Container */}
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={currentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              {selectedPollutants?.map((pollutant) => (
                <Line
                  key={pollutant}
                  type="monotone"
                  dataKey={pollutant}
                  stroke={pollutantColors?.[pollutant]}
                  strokeWidth={2}
                  dot={{ fill: pollutantColors?.[pollutant], strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: pollutantColors?.[pollutant], strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          ) : (
            <AreaChart data={currentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              {selectedPollutants?.map((pollutant, index) => (
                <Area
                  key={pollutant}
                  type="monotone"
                  dataKey={pollutant}
                  stackId={index}
                  stroke={pollutantColors?.[pollutant]}
                  fill={pollutantColors?.[pollutant]}
                  fillOpacity={0.3}
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
      {/* AQI Reference Zones */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <h3 className="text-sm font-medium text-foreground mb-3">AQI Reference Zones</h3>
        <div className="flex flex-wrap gap-4">
          {getAQIZones()?.map((zone, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: zone?.color }}
              />
              <span className="text-xs text-muted-foreground">
                {zone?.label} (0-{zone?.value})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HistoricalChart;