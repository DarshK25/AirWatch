import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';

const ThemeToggle = ({ className = '', size = 'default' }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const sizes = {
    sm: {
      button: 'w-8 h-8',
      icon: 14
    },
    default: {
      button: 'w-10 h-10',
      icon: 16
    },
    lg: {
      button: 'w-12 h-12',
      icon: 20
    }
  };

  const currentSize = sizes?.[size] || sizes?.default;

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    if (newTheme) {
      document.documentElement?.classList?.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement?.classList?.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)')?.matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement?.classList?.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement?.classList?.remove('dark');
    }
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(e?.matches);
        if (e?.matches) {
          document.documentElement?.classList?.add('dark');
        } else {
          document.documentElement?.classList?.remove('dark');
        }
      }
    };

    mediaQuery?.addEventListener('change', handleChange);
    return () => mediaQuery?.removeEventListener('change', handleChange);
  }, []);

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${currentSize?.button} rounded-lg border border-border bg-card hover:bg-muted
        flex items-center justify-center transition-smooth
        focus:outline-none focus:ring-2 focus:ring-primary/20
        ${className}
      `}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative">
        {/* Sun Icon */}
        <Icon
          name="Sun"
          size={currentSize?.icon}
          className={`
            absolute inset-0 transition-all duration-300
            ${isDarkMode 
              ? 'opacity-0 rotate-90 scale-0' :'opacity-100 rotate-0 scale-100'
            }
            text-amber-500
          `}
        />
        
        {/* Moon Icon */}
        <Icon
          name="Moon"
          size={currentSize?.icon}
          className={`
            transition-all duration-300
            ${isDarkMode 
              ? 'opacity-100 rotate-0 scale-100' :'opacity-0 -rotate-90 scale-0'
            }
            text-slate-700 dark:text-slate-300
          `}
        />
      </div>
    </button>
  );
};

export default ThemeToggle;