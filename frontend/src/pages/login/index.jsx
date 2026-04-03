import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import AQIBackground from './components/AQIBackground';
import LoginHeader from './components/LoginHeader';
import authService from '../../services/authService';

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Check for success message from registration
  useEffect(() => {
    if (location.state?.message && location.state?.type === 'success') {
      setSuccessMessage(location.state.message);
      // Clear the message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [location.state]);

  const handleLogin = async (formData) => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const loginData = await authService.login({
        email: formData.email,
        password: formData.password
      });

      // Remember me functionality
      if (formData.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is already logged in
  useEffect(() => {
    if (authService.isAuthenticated() && !authService.isTokenExpired()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Dynamic AQI Background */}
      <AQIBackground />
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="glass-card p-8 rounded-2xl border border-border/50 backdrop-blur-xl">
            {/* Header */}
            <LoginHeader />
            
            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-green-600">{successMessage}</p>
              </div>
            )}
            
            {/* Login Form */}
            <LoginForm 
              onSubmit={handleLogin}
              isLoading={isLoading}
              error={error}
            />
          </div>

          {/* Demo Information */}
          <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border/30">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">
                Create an account or use demo credentials:
              </p>
              <div className="space-y-1 text-xs font-mono">
                <div className="text-foreground">
                  <span className="text-muted-foreground">Demo Email:</span> demo@example.com
                </div>
                <div className="text-foreground">
                  <span className="text-muted-foreground">Demo Password:</span> demo123
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              <span className="text-foreground font-medium">Authenticating...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;