import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { getAqiHistory } from '../../../utils/api';

const ComparisonCharts = ({ filters, stations }) => {
  const [comparisonData, setComparisonData] = useState([]);
  const [chartType, setChartType] = useState('bar');
  const [comparisonMode, setComparisonMode] = useState('stations');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchComparisonData = async () => {
      if (!stations || stations.length === 0) return;
      
      setIsLoading(true);
      try {
        const data = [];
        
        if (comparisonMode === 'stations') {
          // Compare current AQI across stations
          for (const station of stations) {
            const history = await getAqiHistory(station.id, 24); // Last 24 hours
            const avgAQI = history.length > 0 
              ? Math.round(history.reduce((sum, r) => sum + r.overall_aqi, 0) / history.length)
              : 0;
            
            data.push({
              name: station.name.split(',')[0], // Short name
              fullName: station.name,
              aqi: avgAQI,
              pm25: history.length > 0 ? Math.round(history.reduce((sum, r) => sum + (r.pollutants?.pm25 || 0), 0) / history.length) : 0,
              pm10: history.length > 0 ? Math.round(history.reduce((sum, r) => sum + (r.pollutants?.pm10 || 0), 0) / history.length) : 0,
              no2: history.length > 0 ? Math.round(history.reduce((sum, r) => sum + (r.pollutants?.no2 || 0), 0) / history.length) : 0,
              so2: history.length > 0 ? Math.round(history.reduce((sum, r) => sum + (r.pollutants?.so2 || 0), 0) / history.length) : 0,
              o3: history.length > 0 ? Math.round(history.reduce((sum, r) => sum + (r.pollutants?.o3 || 0), 0) / history.length) : 0,
              compliance: avgAQI <= 100 ? 100 : Math.max(0, 100 - (avgAQI - 100) * 2)
            });
          }
        } else if (comparisonMode === 'months') {
          // Compare monthly averages for a station
          const stationId = stations[0]?.id;
          if (stationId) {
            const history = await getAqiHistory(stationId, 720); // Last 30 days
            
            const monthlyData = {};
            history.forEach(record => {
              const month = new Date(record.datetime).toLocaleDateString('en-US', { month: 'short' });
              if (!monthlyData[month]) {
                monthlyData[month] = { sum: 0, count: 0 };
              }
              monthlyData[month].sum += record.overall_aqi;
              monthlyData[month].count += 1;
            });
            
            Object.entries(monthlyData).forEach(([month, data]) => {
              const avgAQI = Math.round(data.sum / data.count);
              
              data.push({
                name: month,
                aqi: avgAQI,
                pm25: Math.round(avgAQI * 0.6),
                pm10: Math.round(avgAQI * 0.8),
                no2: Math.round(avgAQI * 0.4),
                so2: Math.round(avgAQI * 0.3),
                o3: Math.round(avgAQI * 0.5),
                compliance: avgAQI <= 100 ? 100 : Math.max(0, 100 - (avgAQI - 100) * 2)
              });
            });
          }
        }
        
        setComparisonData(data);
      } catch (error) {
        console.error('Error fetching comparison data:', error);
        setComparisonData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComparisonData();
  }, [stations, comparisonMode]);

  const renderChart = () => {
    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="aqi" fill="#3B82F6" name="AQI" />
            <Bar dataKey="pm25" fill="#EF4444" name="PM2.5" />
            <Bar dataKey="pm10" fill="#F59E0B" name="PM10" />
          </BarChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'radar') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={comparisonData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" />
            <PolarRadiusAxis />
            <Radar name="AQI" dataKey="aqi" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
            <Radar name="PM2.5" dataKey="pm25" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
            <Radar name="PM10" dataKey="pm10" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
            <Tooltip />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Compare:</label>
          <select
            value={comparisonMode}
            onChange={(e) => setComparisonMode(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="stations">Stations</option>
            <option value="months">Months</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Chart:</label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            <option value="bar">Bar Chart</option>
            <option value="radar">Radar Chart</option>
          </select>
        </div>
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : comparisonData.length > 0 ? (
        renderChart()
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No comparison data available
        </div>
      )}
    </div>
  );
};

export default ComparisonCharts;