import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';
import { useAirQuality } from '../../context/AirQualityContext';
import authService from '../../services/authService';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { averageAqi, loading } = useAirQuality();

  const getAQIStatus = (aqi) => {
    if (aqi <= 50) return { label: 'Good', key: 'good' };
    if (aqi <= 100) return { label: 'Satisfactory', key: 'moderate' };
    if (aqi <= 200) return { label: 'Moderate', key: 'unhealthy-sensitive' };
    if (aqi <= 300) return { label: 'Poor', key: 'unhealthy' };
    if (aqi <= 400) return { label: 'Very Poor', key: 'very-unhealthy' };
    return { label: 'Severe', key: 'hazardous' };
  };

  const aqiStatus = getAQIStatus(averageAqi);

  const userData = (() => {
    try { return JSON.parse(localStorage.getItem('userData') || 'null'); } catch { return null; }
  })();

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/station-details', label: 'Stations', icon: 'MapPin' },
    { path: '/historical-analytics', label: 'Analytics', icon: 'TrendingUp' },
    { path: '/alerts-management', label: 'Alerts', icon: 'Bell' },
  
  ];

  const getAQIColor = (status) => {
    const colors = {
      good: 'text-aqi-good',
      moderate: 'text-aqi-moderate',
      'unhealthy-sensitive': 'text-aqi-unhealthy-sensitive',
      unhealthy: 'text-aqi-unhealthy',
      'very-unhealthy': 'text-aqi-very-unhealthy',
      hazardous: 'text-aqi-hazardous'
    };
    return colors?.[status] || 'text-aqi-good';
  };

  const getAQIBgColor = (status) => {
    const colors = {
      good: 'bg-aqi-good/10',
      moderate: 'bg-aqi-moderate/10',
      'unhealthy-sensitive': 'bg-aqi-unhealthy-sensitive/10',
      unhealthy: 'bg-aqi-unhealthy/10',
      'very-unhealthy': 'bg-aqi-very-unhealthy/10',
      hazardous: 'bg-aqi-hazardous/10'
    };
    return colors?.[status] || 'bg-aqi-good/10';
  };

  const isActivePath = (path) => {
    return location?.pathname === path;
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement?.classList?.toggle('dark');
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
    setIsProfileOpen(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event?.target?.closest('.profile-dropdown')) {
        setIsProfileOpen(false);
      }
      if (!event?.target?.closest('.mobile-menu')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Icon name="Wind" size={20} color="white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-foreground">AirWatch</span>
            <span className="text-xs text-primary font-medium">Pro</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navigationItems?.map((item) => (
            <button
              key={item?.path}
              onClick={() => handleNavigation(item?.path)}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-smooth
                ${isActivePath(item?.path)
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }
              `}
              title={item?.tooltip}
            >
              <Icon name={item?.icon} size={16} />
              <span>{item?.label}</span>
            </button>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* AQI Status Indicator */}
          <div className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full ${getAQIBgColor(aqiStatus.key)} aqi-breathing`}>
            <div className={`w-2 h-2 rounded-full ${getAQIColor(aqiStatus.key)?.replace('text-', 'bg-')}`} />
            <span className="text-sm font-mono font-medium text-foreground">
              {loading ? '…' : `AQI ${averageAqi}`}
            </span>
            <span className={`text-xs font-medium ${getAQIColor(aqiStatus.key)}`}>
              {aqiStatus.label}
            </span>
          </div>

          {/* User Profile Dropdown */}
          <div className="relative profile-dropdown">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted transition-smooth"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Icon name="User" size={16} color="white" />
              </div>
              <Icon name="ChevronDown" size={16} className="text-muted-foreground" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-lg shadow-lg py-2 animate-slide-in">
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-sm font-medium text-foreground">
                    {userData?.full_name || 'Environmental Admin'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {userData?.email || 'admin@airwatch.pro'}
                  </p>
                </div>
                
                <div className="py-1">
                  <button
                    onClick={toggleTheme}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-smooth"
                  >
                    <Icon name={isDarkMode ? "Sun" : "Moon"} size={16} />
                    <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>
                  
                  <button className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-smooth">
                    <Icon name="Settings" size={16} />
                    <span>Settings</span>
                  </button>
                  
                  <button className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-smooth">
                    <Icon name="HelpCircle" size={16} />
                    <span>Help & Support</span>
                  </button>
                </div>
                
                <div className="border-t border-border pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-smooth"
                  >
                    <Icon name="LogOut" size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-smooth mobile-menu"
          >
            <Icon name={isMenuOpen ? "X" : "Menu"} size={20} />
          </button>
        </div>
      </div>
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-card border-t border-border mobile-menu">
          <div className="px-4 py-2">
            {/* Mobile AQI Status */}
            <div className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg mb-3 ${getAQIBgColor(aqiStatus.key)}`}>
              <div className={`w-2 h-2 rounded-full ${getAQIColor(aqiStatus.key)?.replace('text-', 'bg-')}`} />
              <span className="text-sm font-mono font-medium text-foreground">AQI {averageAqi}</span>
              <span className={`text-xs font-medium ${getAQIColor(aqiStatus.key)}`}>{aqiStatus.label}</span>
            </div>

            {/* Mobile Navigation Items */}
            <nav className="space-y-1">
              {navigationItems?.map((item) => (
                <button
                  key={item?.path}
                  onClick={() => handleNavigation(item?.path)}
                  className={`
                    flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-smooth
                    ${isActivePath(item?.path)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }
                  `}
                >
                  <Icon name={item?.icon} size={18} />
                  <span>{item?.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;