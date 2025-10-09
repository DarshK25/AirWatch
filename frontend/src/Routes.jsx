import React, { Suspense } from 'react';
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load components for better performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const StationDetail = React.lazy(() => import('./pages/StationDetail'));
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
            {/* Main Routes */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/station/:stationId" element={<StationDetail />} />
            
            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </RouterRoutes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;