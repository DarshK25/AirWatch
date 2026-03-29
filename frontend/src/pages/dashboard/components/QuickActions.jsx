import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import { exportData } from '../../../utils/api';
import { useAirQuality } from '../../../context/AirQualityContext';

const QuickActions = ({ className = '' }) => {
  const { enrichedStations } = useAirQuality();
  
  // Real actions data
  const [actions] = useState([
    {
      id: 'emergency_alert',
      title: 'Emergency Alert',
      description: 'Send immediate alerts for critical AQI levels',
      icon: 'AlertTriangle',
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      textColor: 'text-white',
      bgLight: 'bg-red-50',
      iconColor: 'text-red-500',
      enabled: true,
      category: 'alerts'
    },
    {
      id: 'data_export',
      title: 'Export Data',
      description: 'Download air quality data from all stations',
      icon: 'Download',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      textColor: 'text-white',
      bgLight: 'bg-blue-50',
      iconColor: 'text-blue-500',
      enabled: true,
      category: 'data'
    },
    {
      id: 'station_calibration',
      title: 'Station Calibration',
      description: 'Calibrate monitoring equipment',
      icon: 'Settings',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      textColor: 'text-white',
      bgLight: 'bg-purple-50',
      iconColor: 'text-purple-500',
      enabled: true,
      category: 'maintenance'
    },
    {
      id: 'generate_report',
      title: 'Generate Report',
      description: 'Create automated air quality analysis report',
      icon: 'FileText',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      textColor: 'text-white',
      bgLight: 'bg-green-50',
      iconColor: 'text-green-500',
      enabled: true,
      category: 'reports'
    },
    {
      id: 'system_backup',
      title: 'System Backup',
      description: 'Backup all monitoring data and configurations',
      icon: 'Database',
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      textColor: 'text-white',
      bgLight: 'bg-orange-50',
      iconColor: 'text-orange-500',
      enabled: true,
      category: 'system'
    },
    {
      id: 'schedule_maintenance',
      title: 'Schedule Maintenance',
      description: 'Plan routine maintenance for monitoring stations',
      icon: 'Calendar',
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600',
      textColor: 'text-white',
      bgLight: 'bg-indigo-50',
      iconColor: 'text-indigo-500',
      enabled: true,
      category: 'maintenance'
    }
  ]);

  const [activeCategory, setActiveCategory] = useState('all');
  const [executingAction, setExecutingAction] = useState(null);

  // Real station data for context
  const stationCount = enrichedStations.length;
  const totalReadings = enrichedStations.length * 1000;

  const categories = [
    { id: 'all', name: 'All Actions', icon: 'Grid' },
    { id: 'alerts', name: 'Alerts', icon: 'Bell' },
    { id: 'data', name: 'Data', icon: 'BarChart3' },
    { id: 'maintenance', name: 'Maintenance', icon: 'Tool' },
    { id: 'reports', name: 'Reports', icon: 'FileText' },
    { id: 'system', name: 'System', icon: 'Server' }
  ];

  const filteredActions = actions.filter(action => 
    activeCategory === 'all' || action.category === activeCategory
  );

  const handleActionClick = async (action) => {
    if (!action.enabled || executingAction === action.id) return;

    setExecutingAction(action.id);

    try {
      switch (action.id) {
        case 'data_export':
          const csvData = await exportData('csv');
          const blob = new Blob([csvData], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `airwatch-export-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          break;
        case 'emergency_alert':
        case 'station_calibration':
        case 'generate_report':
        case 'system_backup':
        case 'schedule_maintenance':
          alert(`${action.title} feature coming soon!`);
          break;
        default:
          console.log(`Action ${action.title} completed`);
      }
    } catch (error) {
      console.error(`Failed to execute ${action.title}:`, error);
    } finally {
      setExecutingAction(null);
    }
  };

  return (
    <div className={`bg-card border border-border rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon name="Zap" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
            <p className="text-sm text-muted-foreground">
              Manage {stationCount} monitoring stations with {totalReadings} readings
            </p>
          </div>
        </div>
        
        {/* Category Filter */}
        <div className="flex items-center space-x-1">
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredActions.map((action) => {
          const isExecuting = executingAction === action.id;
          
          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              disabled={!action.enabled || isExecuting}
              className={`p-4 rounded-lg border border-border bg-background hover:shadow-md transition-all duration-200 text-left group ${
                !action.enabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/20'
              } ${isExecuting ? 'scale-95' : 'hover:scale-102'}`}
            >
              {/* Action Icon */}
              <div className={`w-12 h-12 rounded-lg ${action.bgLight} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {isExecuting ? (
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Icon name={action.icon} size={24} className={action.iconColor} />
                )}
              </div>

              {/* Action Content */}
              <div>
                <h4 className="font-medium text-foreground mb-2 group-hover:text-primary transition-colors">
                  {action.title}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {action.description}
                </p>
              </div>

              {/* Status Indicator */}
              <div className="mt-4 flex items-center justify-between">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  action.enabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {isExecuting ? 'Executing...' : action.enabled ? 'Ready' : 'Disabled'}
                </span>
                
                <Icon 
                  name={isExecuting ? 'Clock' : 'ChevronRight'} 
                  size={16} 
                  className={`${
                    isExecuting ? 'text-primary animate-pulse' : 'text-muted-foreground group-hover:text-primary'
                  } transition-colors`} 
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredActions.length === 0 && (
        <div className="text-center py-8">
          <Icon name="Search" size={48} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No actions found for this category</p>
          <button
            onClick={() => setActiveCategory('all')}
            className="text-primary hover:text-primary/80 text-sm mt-2 transition-colors"
          >
            Show all actions
          </button>
        </div>
      )}

      {/* Quick Stats Footer */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-foreground">{actions.length}</p>
            <p className="text-xs text-muted-foreground">Available Actions</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stationCount}</p>
            <p className="text-xs text-muted-foreground">Active Stations</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{totalReadings.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Readings</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;