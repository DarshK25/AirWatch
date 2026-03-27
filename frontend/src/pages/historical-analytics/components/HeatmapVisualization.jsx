import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import { getAqiHistory } from '../../../utils/api';

const HeatmapVisualization = ({ filters, stations }) => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [selectedView, setSelectedView] = useState('daily');
  const [selectedPollutant, setSelectedPollutant] = useState('overall_aqi');
  const [isLoading, setIsLoading] = useState(false);

  const pollutantOptions = [
    { value: 'overall_aqi', label: 'AQI', color: '#3B82F6' },
    { value: 'pm25', label: 'PM2.5', color: '#EF4444' },
    { value: 'pm10', label: 'PM10', color: '#F59E0B' },
    { value: 'no2', label: 'NO₂', color: '#8B5CF6' },
    { value: 'so2', label: 'SO₂', color: '#06B6D4' },
    { value: 'o3', label: 'O₃', color: '#10B981' }
  ];

  useEffect(() => {
    const fetchHeatmapData = async () => {
      if (!stations || stations.length === 0) return;
      
      setIsLoading(true);
      try {
        const allData = [];
        
        // Fetch data for each station
        for (const station of stations.slice(0, 3)) { // Limit to 3 stations for performance
          const history = await getAqiHistory(station.id, 168); // Last 7 days
          
          // Group by hour of day
          const hourlyData = {};
          history.forEach(record => {
            const hour = new Date(record.datetime).getHours();
            const value = selectedPollutant === 'overall_aqi' ? record.overall_aqi : (record.pollutants?.[selectedPollutant] || 0);
            
            if (!hourlyData[hour]) {
              hourlyData[hour] = { sum: 0, count: 0 };
            }
            hourlyData[hour].sum += value;
            hourlyData[hour].count += 1;
          });
          
          // Convert to heatmap format
          Object.entries(hourlyData).forEach(([hour, data]) => {
            allData.push({
              station: station.name,
              hour: parseInt(hour),
              value: Math.round(data.sum / data.count),
              day: selectedView
            });
          });
        }
        
        setHeatmapData(allData);
      } catch (error) {
        console.error('Error fetching heatmap data:', error);
        setHeatmapData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHeatmapData();
  }, [stations, selectedPollutant, selectedView]);

  const getHeatmapColor = (value) => {
    if (value <= 50) return '#10B981';
    if (value <= 100) return '#84CC16';
    if (value <= 200) return '#F59E0B';
    if (value <= 300) return '#F97316';
    if (value <= 400) return '#EF4444';
    return '#7C3AED';
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const stationNames = [...new Set(heatmapData.map(d => d.station))];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Pollutant:</label>
          <select
            value={selectedPollutant}
            onChange={(e) => setSelectedPollutant(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            {pollutantOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">View:</label>
          <select
            value={selectedView}
            onChange={(e) => setSelectedView(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="daily">Daily Pattern</option>
            <option value="weekly">Weekly Average</option>
          </select>
        </div>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : heatmapData.length > 0 ? (
          <div className="min-w-max">
            <div className="grid grid-cols-25 gap-1 mb-2">
              <div className="text-xs font-medium text-muted-foreground"></div>
              {hours.map(hour => (
                <div key={hour} className="text-xs font-medium text-muted-foreground text-center">
                  {hour}:00
                </div>
              ))}
            </div>
            
            {stationNames.map(stationName => (
              <div key={stationName} className="grid grid-cols-25 gap-1 mb-1 items-center">
                <div className="text-xs font-medium text-right pr-2 min-w-32 truncate">
                  {stationName}
                </div>
                {hours.map(hour => {
                  const dataPoint = heatmapData.find(d => d.station === stationName && d.hour === hour);
                  const value = dataPoint?.value || 0;
                  
                  return (
                    <div
                      key={hour}
                      className="w-8 h-8 rounded-sm border flex items-center justify-center text-xs font-medium cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: value > 0 ? getHeatmapColor(value) : '#f3f4f6' }}
                      title={`${stationName} ${hour}:00 - ${value}`}
                    >
                      {value > 0 ? value : '-'}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No heatmap data available
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 text-xs">
        <span className="text-muted-foreground">Good</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#10B981' }}></div>
          <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#84CC16' }}></div>
          <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#F59E0B' }}></div>
          <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#F97316' }}></div>
          <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#EF4444' }}></div>
          <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#7C3AED' }}></div>
        </div>
        <span className="text-muted-foreground">Severe</span>
      </div>
    </div>
  );
};

export default HeatmapVisualization;