import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

const UserProfileDropdown = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user] = useState({
    name: 'Dr. Sarah Chen',
    email: 'sarah.chen@airwatch.pro',
    role: 'Environmental Specialist',
    avatar: null,
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  });
  
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const menuItems = [
    {
      label: 'Profile Settings',
      icon: 'User',
      action: () => console.log('Profile settings'),
      description: 'Manage your account preferences'
    },
    {
      label: 'Notification Preferences',
      icon: 'Bell',
      action: () => console.log('Notifications'),
      description: 'Configure alert settings'
    },
    {
      label: 'Data Export',
      icon: 'Download',
      action: () => console.log('Data export'),
      description: 'Export monitoring data'
    },
    {
      label: 'API Access',
      icon: 'Key',
      action: () => console.log('API access'),
      description: 'Manage API keys and tokens'
    },
    {
      label: 'Help & Documentation',
      icon: 'HelpCircle',
      action: () => console.log('Help'),
      description: 'User guides and support'
    }
  ];

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement?.classList?.toggle('dark');
    localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
    setIsOpen(false);
  };

  const formatLastLogin = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Active now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef?.current && !dropdownRef?.current?.contains(event?.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement?.classList?.add('dark');
    }
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted transition-smooth focus:outline-none focus:ring-2 focus:ring-primary/20"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            {user?.avatar ? (
              <img 
                src={user?.avatar} 
                alt={user?.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-white">
                {user?.name?.split(' ')?.map(n => n?.[0])?.join('')}
              </span>
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-card" />
        </div>

        {/* User Info (Hidden on mobile) */}
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-foreground truncate max-w-32">
            {user?.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {user?.role}
          </p>
        </div>

        {/* Dropdown Arrow */}
        <Icon 
          name="ChevronDown" 
          size={16} 
          className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-xl shadow-xl py-2 animate-slide-in z-50">
          {/* User Header */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                {user?.avatar ? (
                  <img 
                    src={user?.avatar} 
                    alt={user?.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-semibold text-white">
                    {user?.name?.split(' ')?.map(n => n?.[0])?.join('')}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatLastLogin(user?.lastLogin)}
                </p>
              </div>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="px-2 py-2 border-b border-border">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-between w-full px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-smooth"
            >
              <div className="flex items-center space-x-3">
                <Icon name={isDarkMode ? "Sun" : "Moon"} size={16} />
                <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
              <div className={`
                w-10 h-5 rounded-full transition-colors relative
                ${isDarkMode ? 'bg-primary' : 'bg-muted-foreground/30'}
              `}>
                <div className={`
                  absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform
                  ${isDarkMode ? 'translate-x-5' : 'translate-x-0.5'}
                `} />
              </div>
            </button>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems?.map((item, index) => (
              <button
                key={index}
                onClick={item?.action}
                className="flex items-start space-x-3 w-full px-4 py-3 text-sm text-foreground hover:bg-muted transition-smooth"
              >
                <Icon name={item?.icon} size={16} className="mt-0.5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium">{item?.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item?.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Logout */}
          <div className="border-t border-border pt-2">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-smooth"
            >
              <Icon name="LogOut" size={16} />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;