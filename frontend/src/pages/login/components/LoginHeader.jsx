import React from 'react';
import Icon from '../../../components/AppIcon';

const LoginHeader = () => {
  return (
    <div className="text-center mb-8">
      {/* Logo */}
      <div className="flex items-center justify-center space-x-3 mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary shadow-lg">
          <Icon name="Wind" size={24} color="white" />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-2xl font-bold text-foreground">AirWatch</span>
          <span className="text-sm text-primary font-semibold">Pro</span>
        </div>
      </div>

      {/* Welcome Text */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome Back
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Sign in to access real-time AQI monitoring and predictive analytics for industrial air quality management.
        </p>
      </div>

      {/* Current Status Badge */}
      <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 mt-4">
        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
        <span className="text-sm font-medium text-success">
          System Online
        </span>
        <span className="text-xs text-muted-foreground">
          • Live Data Active
        </span>
      </div>
    </div>
  );
};

export default LoginHeader;