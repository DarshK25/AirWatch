import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ActionControls = ({ stationId, stationName }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(100);
  const [comparisonStations, setComparisonStations] = useState([]);

  const exportFormats = [
    { value: 'pdf', label: 'PDF Report', icon: 'FileText' },
    { value: 'csv', label: 'CSV Data', icon: 'Download' },
    { value: 'excel', label: 'Excel Workbook', icon: 'FileSpreadsheet' }
  ];

  const nearbyStations = [
    { id: 'TB-02', name: 'Thane Creek Station', distance: '2.3 km' },
    { id: 'TB-03', name: 'Belapur Industrial', distance: '3.7 km' },
    { id: 'TB-04', name: 'Vashi Commercial', distance: '4.1 km' },
    { id: 'TB-05', name: 'Nerul Residential', distance: '5.2 km' }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    
    // Simulate export process
    setTimeout(() => {
      const fileName = `${stationName?.replace(/\s+/g, '_')}_${exportFormat}_${new Date()?.toISOString()?.split('T')?.[0]}`;
      console.log(`Exporting ${fileName}.${exportFormat}`);
      setIsExporting(false);
      
      // Show success message (in real app, this would trigger actual download)
      alert(`Export completed: ${fileName}.${exportFormat}`);
    }, 2000);
  };

  const toggleStationComparison = (stationId) => {
    setComparisonStations(prev => 
      prev?.includes(stationId)
        ? prev?.filter(id => id !== stationId)
        : [...prev, stationId]
    );
  };

  const handleAlertConfiguration = () => {
    console.log('Configuring alerts:', { alertsEnabled, alertThreshold });
    alert(`Alert configuration updated:\nEnabled: ${alertsEnabled}\nThreshold: ${alertThreshold} AQI`);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Station Controls</h2>
      <div className="space-y-6">
        {/* Data Export Section */}
        <div className="border-b border-border pb-6">
          <h3 className="text-lg font-medium text-foreground mb-4 flex items-center space-x-2">
            <Icon name="Download" size={20} />
            <span>Data Export</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {exportFormats?.map((format) => (
              <button
                key={format?.value}
                onClick={() => setExportFormat(format?.value)}
                className={`
                  flex items-center space-x-3 p-3 rounded-lg border transition-smooth
                  ${exportFormat === format?.value
                    ? 'border-primary bg-primary/10 text-primary' :'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <Icon name={format?.icon} size={18} />
                <span className="font-medium">{format?.label}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleExport}
              loading={isExporting}
              iconName="Download"
              iconPosition="left"
              className="flex-1"
            >
              {isExporting ? 'Exporting...' : `Export as ${exportFormat?.toUpperCase()}`}
            </Button>
            
            <Button
              variant="outline"
              iconName="Calendar"
              iconPosition="left"
              onClick={() => console.log('Schedule export')}
            >
              Schedule Export
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            Export includes historical data, predictions, and pollutant breakdowns for the last 30 days
          </p>
        </div>

        {/* Alert Configuration Section */}
        <div className="border-b border-border pb-6">
          <h3 className="text-lg font-medium text-foreground mb-4 flex items-center space-x-2">
            <Icon name="Bell" size={20} />
            <span>Alert Configuration</span>
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Enable Alerts</p>
                <p className="text-sm text-muted-foreground">Receive notifications when AQI exceeds threshold</p>
              </div>
              <button
                onClick={() => setAlertsEnabled(!alertsEnabled)}
                className={`
                  relative w-12 h-6 rounded-full transition-colors
                  ${alertsEnabled ? 'bg-primary' : 'bg-muted-foreground/30'}
                `}
              >
                <div className={`
                  absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform
                  ${alertsEnabled ? 'translate-x-6' : 'translate-x-0.5'}
                `} />
              </button>
            </div>

            {alertsEnabled && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Alert Threshold (AQI)
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="50"
                    max="300"
                    step="10"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(Number(e?.target?.value))}
                    className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-lg font-mono font-semibold text-foreground min-w-[3rem]">
                    {alertThreshold}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Good (50)</span>
                  <span>Moderate (100)</span>
                  <span>Unhealthy (150)</span>
                  <span>Hazardous (300)</span>
                </div>
              </div>
            )}

            <Button
              onClick={handleAlertConfiguration}
              variant="outline"
              iconName="Settings"
              iconPosition="left"
              fullWidth
            >
              Update Alert Settings
            </Button>
          </div>
        </div>

        {/* Station Comparison Section */}
        <div>
          <h3 className="text-lg font-medium text-foreground mb-4 flex items-center space-x-2">
            <Icon name="BarChart3" size={20} />
            <span>Compare with Nearby Stations</span>
          </h3>

          <div className="space-y-2 mb-4">
            {nearbyStations?.map((station) => (
              <div
                key={station?.id}
                className={`
                  flex items-center justify-between p-3 rounded-lg border transition-smooth cursor-pointer
                  ${comparisonStations?.includes(station?.id)
                    ? 'border-primary bg-primary/10' :'border-border hover:border-primary/50'
                  }
                `}
                onClick={() => toggleStationComparison(station?.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`
                    w-4 h-4 rounded border-2 transition-colors
                    ${comparisonStations?.includes(station?.id)
                      ? 'border-primary bg-primary' :'border-muted-foreground'
                    }
                  `}>
                    {comparisonStations?.includes(station?.id) && (
                      <Icon name="Check" size={12} color="white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{station?.name}</p>
                    <p className="text-sm text-muted-foreground">{station?.id}</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">{station?.distance}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              iconName="BarChart3"
              iconPosition="left"
              disabled={comparisonStations?.length === 0}
              onClick={() => console.log('Compare stations:', comparisonStations)}
              className="flex-1"
            >
              Compare Selected ({comparisonStations?.length})
            </Button>
            
            <Button
              variant="ghost"
              iconName="X"
              iconPosition="left"
              onClick={() => setComparisonStations([])}
              disabled={comparisonStations?.length === 0}
            >
              Clear Selection
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            Select up to 4 stations for comparative analysis of AQI trends and pollutant levels
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActionControls;