import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const ExportPanel = ({ filters, onExport }) => {
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportOptions, setExportOptions] = useState({
    includeCharts: true,
    includeStatistics: true,
    includeRawData: false,
    includeMetadata: true,
    compressData: false
  });
  const [isExporting, setIsExporting] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    start: filters?.dateRange?.startDate || '2024-01-01',
    end: filters?.dateRange?.endDate || '2024-12-31'
  });

  const exportFormats = [
    {
      value: 'pdf',
      label: 'PDF Report',
      icon: 'FileText',
      description: 'Comprehensive report with charts and analysis',
      size: '~2-5 MB'
    },
    {
      value: 'csv',
      label: 'CSV Data',
      icon: 'Table',
      description: 'Raw data in spreadsheet format',
      size: '~500 KB - 2 MB'
    },
    {
      value: 'excel',
      label: 'Excel Workbook',
      icon: 'FileSpreadsheet',
      description: 'Multi-sheet workbook with data and charts',
      size: '~1-3 MB'
    },
    {
      value: 'json',
      label: 'JSON Data',
      icon: 'Code',
      description: 'Machine-readable data format',
      size: '~200 KB - 1 MB'
    }
  ];

  const dataCategories = [
    {
      key: 'includeCharts',
      label: 'Charts & Visualizations',
      description: 'Include all generated charts and graphs'
    },
    {
      key: 'includeStatistics',
      label: 'Statistical Summary',
      description: 'Descriptive statistics and analysis'
    },
    {
      key: 'includeRawData',
      label: 'Raw Data Points',
      description: 'Individual measurement records'
    },
    {
      key: 'includeMetadata',
      label: 'Metadata & Context',
      description: 'Station info, measurement conditions'
    },
    {
      key: 'compressData',
      label: 'Compress Output',
      description: 'Reduce file size (may affect quality)'
    }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const exportData = {
        format: exportFormat,
        options: exportOptions,
        dateRange: customDateRange,
        filters: filters,
        timestamp: new Date()?.toISOString(),
        filename: `airwatch-analytics-${exportFormat}-${Date.now()}`
      };
      
      // In a real application, this would trigger the actual export
      console.log('Exporting data:', exportData);
      
      // Simulate file download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportData?.filename}.${exportFormat}`;
      document.body?.appendChild(a);
      a?.click();
      document.body?.removeChild(a);
      URL.revokeObjectURL(url);
      
      if (onExport) {
        onExport(exportData);
      }
      
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleOptionChange = (key) => {
    setExportOptions(prev => ({
      ...prev,
      [key]: !prev?.[key]
    }));
  };

  const getEstimatedSize = () => {
    const selectedFormat = exportFormats?.find(f => f?.value === exportFormat);
    let baseSize = selectedFormat?.size || '~1 MB';
    
    if (exportOptions?.includeRawData) {
      baseSize = baseSize?.replace(/\d+/, (match) => Math.round(parseInt(match) * 1.5));
    }
    if (exportOptions?.compressData) {
      baseSize = baseSize?.replace(/\d+/, (match) => Math.round(parseInt(match) * 0.7));
    }
    
    return baseSize;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
          <Icon name="Download" size={16} className="text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Export Data</h3>
          <p className="text-sm text-muted-foreground">Generate reports and download analysis data</p>
        </div>
      </div>
      <div className="space-y-6">
        {/* Export Format Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">Export Format</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exportFormats?.map((format) => (
              <div
                key={format?.value}
                className={`
                  p-4 border rounded-lg cursor-pointer transition-smooth
                  ${exportFormat === format?.value
                    ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50'
                  }
                `}
                onClick={() => setExportFormat(format?.value)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-lg
                    ${exportFormat === format?.value ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}
                  `}>
                    <Icon name={format?.icon} size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-foreground">{format?.label}</h4>
                      <span className="text-xs text-muted-foreground">{format?.size}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{format?.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Date Range Override */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">Custom Date Range (Optional)</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Start Date</label>
              <input
                type="date"
                value={customDateRange?.start}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e?.target?.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">End Date</label>
              <input
                type="date"
                value={customDateRange?.end}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e?.target?.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">Include in Export</label>
          <div className="space-y-3">
            {dataCategories?.map((category) => (
              <div key={category?.key} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                <Checkbox
                  checked={exportOptions?.[category?.key]}
                  onChange={() => handleOptionChange(category?.key)}
                />
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground cursor-pointer">
                    {category?.label}
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">{category?.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export Summary */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium text-foreground mb-2">Export Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Format:</span>
              <span className="font-medium text-foreground">
                {exportFormats?.find(f => f?.value === exportFormat)?.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date Range:</span>
              <span className="font-medium text-foreground">
                {customDateRange?.start} to {customDateRange?.end}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated Size:</span>
              <span className="font-medium text-foreground">{getEstimatedSize()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Components:</span>
              <span className="font-medium text-foreground">
                {Object.values(exportOptions)?.filter(Boolean)?.length} selected
              </span>
            </div>
          </div>
        </div>

        {/* Export Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Export will be generated based on current filter settings
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setExportOptions({
                  includeCharts: true,
                  includeStatistics: true,
                  includeRawData: false,
                  includeMetadata: true,
                  compressData: false
                });
              }}
            >
              Reset Options
            </Button>
            
            <Button
              onClick={handleExport}
              loading={isExporting}
              iconName="Download"
              iconPosition="left"
              disabled={!Object.values(exportOptions)?.some(Boolean)}
            >
              {isExporting ? 'Generating...' : 'Export Data'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel;