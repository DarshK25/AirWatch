import React from 'react';
import Icon from '../../../components/AppIcon';

const RegistrationHeader = () => {
  return (
    <div className="text-center space-y-4 mb-8">
      {/* Logo */}
      <div className="flex items-center justify-center space-x-3 mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent">
          <Icon name="Wind" size={24} color="white" />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-2xl font-bold text-foreground">AirWatch</span>
          <span className="text-sm text-primary font-semibold">Pro</span>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Join AirWatch Pro
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Create your account to access real-time AQI monitoring, personalized alerts, and comprehensive air quality analytics
        </p>
      </div>

      {/* Features Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
        <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-card border border-border">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <Icon name="Activity" size={20} className="text-green-600" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-semibold text-foreground">Real-time Monitoring</h3>
            <p className="text-xs text-muted-foreground">Live AQI updates</p>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-card border border-border">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Icon name="Bell" size={20} className="text-blue-600" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-semibold text-foreground">Smart Alerts</h3>
            <p className="text-xs text-muted-foreground">Personalized notifications</p>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-2 p-4 rounded-lg bg-card border border-border">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Icon name="TrendingUp" size={20} className="text-purple-600" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-semibold text-foreground">Analytics</h3>
            <p className="text-xs text-muted-foreground">Historical insights</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationHeader;