import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import Icon from '../../../components/AppIcon';

const EmissionSourceChart = ({ className = '' }) => {
  const [viewType, setViewType] = useState('pie');

  const emissionData = [
    { 
      name: 'Industrial', 
      value: 45, 
      color: '#EF4444',
      icon: 'Factory',
      description: 'Manufacturing & Chemical Plants'
    },
    { 
      name: 'Vehicular', 
      value: 28, 
      color: '#F59E0B',
      icon: 'Car',
      description: 'Transportation & Traffic'
    },
    { 
      name: 'Commercial', 
      value: 15, 
      color: '#8B5CF6',
      icon: 'Building2',
      description: 'Commercial Buildings & Offices'
    },
    { 
      name: 'Residential', 
      value: 12, 
      color: '#10B981',
      icon: 'Home',
      description: 'Residential Areas & Cooking'
    }
  ];

  const detailedData = [
    { source: 'Chemical Plants', value: 25, category: 'Industrial' },
    { source: 'Steel Mills', value: 12, category: 'Industrial' },
    { source: 'Power Plants', value: 8, category: 'Industrial' },
    { source: 'Heavy Vehicles', value: 16, category: 'Vehicular' },
    { source: 'Private Cars', value: 8, category: 'Vehicular' },
    { source: 'Two Wheelers', value: 4, category: 'Vehicular' },
    { source: 'Shopping Malls', value: 9, category: 'Commercial' },
    { source: 'Offices', value: 6, category: 'Commercial' },
    { source: 'Cooking', value: 7, category: 'Residential' },
    { source: 'Heating', value: 5, category: 'Residential' }
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload?.length) {
      const data = payload?.[0]?.payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Icon name={data?.icon} size={16} style={{ color: data?.color }} />
            <span className="font-semibold text-foreground">{data?.name}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">{data?.description}</p>
          <p className="text-lg font-mono font-bold text-foreground">{data?.value}%</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100)?.toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className={`glass-card rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Icon name="PieChart" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Emission Sources</h3>
        </div>
        
        <div className="flex bg-muted rounded-lg p-1">
          <button
            onClick={() => setViewType('pie')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-smooth ${
              viewType === 'pie' ?'bg-primary text-primary-foreground' :'text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewType('detailed')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-smooth ${
              viewType === 'detailed' ?'bg-primary text-primary-foreground' :'text-muted-foreground hover:text-foreground'
            }`}
          >
            Detailed
          </button>
        </div>
      </div>
      {viewType === 'pie' ? (
        <>
          {/* Pie Chart */}
          <div className="h-64 w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={emissionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {emissionData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry?.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-4">
            {emissionData?.map((item, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: item?.color }}
                  />
                  <Icon name={item?.icon} size={16} style={{ color: item?.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{item?.name}</span>
                    <span className="text-sm font-mono font-bold text-foreground">{item?.value}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item?.description}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Detailed Bar Chart */}
          <div className="h-64 w-full mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={detailedData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis 
                  type="number" 
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                />
                <YAxis 
                  type="category" 
                  dataKey="source" 
                  stroke="var(--color-muted-foreground)"
                  fontSize={10}
                  width={80}
                />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Contribution']}
                  labelStyle={{ color: 'var(--color-foreground)' }}
                  contentStyle={{ 
                    backgroundColor: 'var(--color-popover)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#3B82F6"
                  radius={[0, 2, 2, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4">
            {emissionData?.map((item, index) => (
              <div key={index} className="text-center p-3 bg-muted/30 rounded-lg">
                <Icon name={item?.icon} size={20} style={{ color: item?.color }} className="mx-auto mb-2" />
                <div className="text-lg font-mono font-bold text-foreground">{item?.value}%</div>
                <div className="text-xs text-muted-foreground">{item?.name}</div>
              </div>
            ))}
          </div>
        </>
      )}
      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          Data updated: {new Date()?.toLocaleDateString('en-IN')} at {new Date()?.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-lg hover:bg-muted transition-smooth" title="Export Data">
            <Icon name="Download" size={14} className="text-muted-foreground" />
          </button>
          <button className="p-2 rounded-lg hover:bg-muted transition-smooth" title="Refresh">
            <Icon name="RotateCcw" size={14} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmissionSourceChart;