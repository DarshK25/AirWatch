import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AlertHistoryCard = ({ alert, onShare }) => {
  const navigate = useNavigate();

  const getAlertIcon = (type) => {
    const icons = {
      'threshold': 'AlertTriangle',
      'predictive': 'TrendingUp',
      'emergency': 'AlertOctagon',
      'maintenance': 'Settings'
    };
    return icons?.[type] || 'Bell';
  };

  const getAlertColor = (severity) => {
    const colors = {
      'moderate': 'text-aqi-moderate',
      'unhealthy': 'text-aqi-unhealthy-sensitive',
      'very-unhealthy': 'text-aqi-unhealthy',
      'hazardous': 'text-aqi-hazardous',
      'emergency': 'text-destructive'
    };
    return colors?.[severity] || 'text-muted-foreground';
  };

  const getAlertBgColor = (severity) => {
    const colors = {
      'moderate': 'bg-aqi-moderate/10',
      'unhealthy': 'bg-aqi-unhealthy-sensitive/10',
      'very-unhealthy': 'bg-aqi-unhealthy/10',
      'hazardous': 'bg-aqi-hazardous/10',
      'emergency': 'bg-destructive/10'
    };
    return colors?.[severity] || 'bg-muted/50';
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date?.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleViewStation = () => {
    navigate(`/station-details/${alert?.stationId}`);
  };

  const handleShare = () => {
    const shareText = `AQI Alert: ${alert?.message}\nStation: ${alert?.stationName}\nAQI: ${alert?.aqiValue}\nTime: ${new Date(alert.timestamp)?.toLocaleString('en-IN')}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'AQI Alert',
        text: shareText,
        url: window.location?.origin
      });
    } else {
      navigator.clipboard?.writeText(shareText);
      onShare && onShare('Alert details copied to clipboard');
    }
  };

  return (
    <div className={`
      bg-card border border-border rounded-xl p-4 transition-smooth hover:shadow-md
      ${getAlertBgColor(alert?.severity)}
    `}>
      <div className="flex items-start space-x-3">
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
          ${getAlertBgColor(alert?.severity)} border border-border
        `}>
          <Icon 
            name={getAlertIcon(alert?.type)} 
            size={18} 
            className={getAlertColor(alert?.severity)}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground truncate">
                {alert?.title}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {alert?.message}
              </p>
            </div>
            <div className="text-xs text-muted-foreground ml-2 flex-shrink-0">
              {formatTimestamp(alert?.timestamp)}
            </div>
          </div>

          <div className="flex items-center space-x-4 mb-3">
            <div className="flex items-center space-x-2">
              <Icon name="MapPin" size={14} className="text-muted-foreground" />
              <span className="text-sm text-foreground">{alert?.stationName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="Activity" size={14} className="text-muted-foreground" />
              <span className={`text-sm font-mono font-medium ${getAlertColor(alert?.severity)}`}>
                AQI {alert?.aqiValue}
              </span>
            </div>
            {alert?.type === 'predictive' && (
              <div className="flex items-center space-x-2">
                <Icon name="Clock" size={14} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {alert?.forecastHours}h forecast
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewStation}
              iconName="ExternalLink"
              iconPosition="right"
              className="text-xs"
            >
              View Station
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              iconName="Share2"
              className="text-xs"
            >
              Share
            </Button>
            {alert?.acknowledged && (
              <div className="flex items-center space-x-1 text-xs text-success ml-auto">
                <Icon name="CheckCircle" size={14} />
                <span>Acknowledged</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertHistoryCard;