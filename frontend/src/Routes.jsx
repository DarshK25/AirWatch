import React, { Suspense } from 'react';
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load components for better performance
const Dashboard = React.lazy(() => import('./pages/dashboard'));
const Landing = React.lazy(() => import('./pages/landing'));
const Stations = React.lazy(() => import('./pages/stations'));
const StationDetails = React.lazy(() => import('./pages/station-details'));
const HistoricalAnalytics = React.lazy(() => import('./pages/historical-analytics'));
const AlertsManagement = React.lazy(() => import('./pages/alerts-management'));
const Login = React.lazy(() => import('./pages/login'));
const Register = React.lazy(() => import('./pages/register'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Loading component for Suspense
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <RouterRoutes>
            {/* Landing page */}
            <Route path="/" element={<Landing />} />
            
            {/* Main application routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/stations" element={<Stations />} />
            <Route path="/station-details/:id" element={<StationDetails />} />
            <Route path="/historical-analytics" element={<HistoricalAnalytics />} />
            <Route path="/alerts-management" element={<AlertsManagement />} />
            
            {/* Authentication routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </RouterRoutes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;