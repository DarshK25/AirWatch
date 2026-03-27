import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

const Breadcrumbs = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const pathMap = {
    '/dashboard': 'Dashboard',
    '/station-details': 'Station Details',
    '/historical-analytics': 'Historical Analytics',
    '/alerts-management': 'Alerts Management'
  };

  const generateBreadcrumbs = () => {
    const pathSegments = location?.pathname?.split('/')?.filter(Boolean);
    const breadcrumbs = [];

    // Always start with Dashboard as home
    breadcrumbs?.push({
      label: 'Dashboard',
      path: '/dashboard',
      isActive: location?.pathname === '/dashboard'
    });

    // Add current page if it's not dashboard
    if (location?.pathname !== '/dashboard') {
      const currentPageLabel = pathMap?.[location?.pathname];
      if (currentPageLabel) {
        breadcrumbs?.push({
          label: currentPageLabel,
          path: location?.pathname,
          isActive: true
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const handleNavigation = (path) => {
    navigate(path);
  };

  if (breadcrumbs?.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs?.map((crumb, index) => (
          <li key={crumb?.path} className="flex items-center space-x-2">
            {index > 0 && (
              <Icon name="ChevronRight" size={14} className="text-muted-foreground/60" />
            )}
            
            {crumb?.isActive ? (
              <span className="font-medium text-foreground">
                {crumb?.label}
              </span>
            ) : (
              <button
                onClick={() => handleNavigation(crumb?.path)}
                className="hover:text-foreground transition-smooth"
              >
                {crumb?.label}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;