import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BulkAlertManager = ({ stations, onBulkUpdate }) => {
  const [selectedStations, setSelectedStations] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [bulkThreshold, setBulkThreshold] = useState(100);
  const [showBulkPanel, setShowBulkPanel] = useState(false);

  const handleSelectAll = () => {
    if (selectedStations?.size === stations?.length) {
      setSelectedStations(new Set());
    } else {
      setSelectedStations(new Set(stations.map(s => s.id)));
    }
  };

  const handleStationToggle = (stationId) => {
    const newSelected = new Set(selectedStations);
    if (newSelected?.has(stationId)) {
      newSelected?.delete(stationId);
    } else {
      newSelected?.add(stationId);
    }
    setSelectedStations(newSelected);
  };

  const handleBulkAction = () => {
    if (!bulkAction || selectedStations?.size === 0) return;

    const actionData = {
      stationIds: Array.from(selectedStations),
      action: bulkAction,
      threshold: bulkAction === 'setThreshold' ? bulkThreshold : null
    };

    onBulkUpdate && onBulkUpdate(actionData);
    setSelectedStations(new Set());
    setShowBulkPanel(false);
  };

  const getStationStatus = (station) => {
    if (station?.alertEnabled) {
      return station?.customThreshold ? 'Custom' : 'Default';
    }
    return 'Disabled';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Custom': return 'text-primary';
      case 'Default': return 'text-success';
      case 'Disabled': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon name="Settings" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Bulk Management</h3>
            <p className="text-sm text-muted-foreground">
              Manage alerts for multiple stations
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowBulkPanel(!showBulkPanel)}
          iconName={showBulkPanel ? "ChevronUp" : "ChevronDown"}
          iconPosition="right"
        >
          {showBulkPanel ? 'Hide' : 'Show'} Panel
        </Button>
      </div>
      {showBulkPanel && (
        <div className="space-y-6">
          {/* Station Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">
                Select Stations ({selectedStations?.size}/{stations?.length})
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                iconName={selectedStations?.size === stations?.length ? "Square" : "CheckSquare"}
              >
                {selectedStations?.size === stations?.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
              {stations?.map((station) => (
                <label
                  key={station?.id}
                  className={`
                    flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-smooth
                    ${selectedStations?.has(station?.id) 
                      ? 'border-primary bg-primary/5' :'border-border hover:bg-muted/50'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={selectedStations?.has(station?.id)}
                    onChange={() => handleStationToggle(station?.id)}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary/20"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {station?.name}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {station?.location}
                      </span>
                      <span className={`text-xs font-medium ${getStatusColor(getStationStatus(station))}`}>
                        {getStationStatus(station)}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedStations?.size > 0 && (
            <div className="space-y-4 pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-foreground">
                Bulk Actions for {selectedStations?.size} station(s)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Action
                  </label>
                  <select
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e?.target?.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select action</option>
                    <option value="enable">Enable alerts</option>
                    <option value="disable">Disable alerts</option>
                    <option value="setThreshold">Set custom threshold</option>
                    <option value="resetThreshold">Reset to default threshold</option>
                  </select>
                </div>

                {bulkAction === 'setThreshold' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Threshold (AQI)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="500"
                      value={bulkThreshold}
                      onChange={(e) => setBulkThreshold(parseInt(e?.target?.value))}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Enter AQI threshold"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleBulkAction}
                  disabled={!bulkAction}
                  iconName="Play"
                >
                  Apply to {selectedStations?.size} Station(s)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedStations(new Set());
                    setBulkAction('');
                  }}
                >
                  Clear Selection
                </Button>
              </div>

              {bulkAction && (
                <div className="flex items-start space-x-2 p-3 bg-muted/50 rounded-lg">
                  <Icon name="Info" size={16} className="text-primary mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    {bulkAction === 'enable' && 'This will enable alerts for all selected stations using their current threshold settings.'}
                    {bulkAction === 'disable' && 'This will disable all alerts for the selected stations.'}
                    {bulkAction === 'setThreshold' && `This will set a custom AQI threshold of ${bulkThreshold} for all selected stations.`}
                    {bulkAction === 'resetThreshold' && 'This will reset all selected stations to use the default global thresholds.'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkAlertManager;