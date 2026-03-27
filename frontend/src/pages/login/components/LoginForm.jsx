import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import Icon from '../../../components/AppIcon';

const LoginForm = ({ onSubmit, isLoading, error }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors?.[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData?.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/?.test(formData?.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData?.password) {
      errors.password = 'Password is required';
    } else if (formData?.password?.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors)?.length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Input */}
      <Input
        label="Email Address"
        type="email"
        placeholder="Enter your email"
        value={formData?.email}
        onChange={(e) => handleInputChange('email', e?.target?.value)}
        error={validationErrors?.email}
        required
        disabled={isLoading}
      />
      {/* Password Input */}
      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        value={formData?.password}
        onChange={(e) => handleInputChange('password', e?.target?.value)}
        error={validationErrors?.password}
        required
        disabled={isLoading}
      />
      {/* Remember Me Checkbox */}
      <div className="flex items-center justify-between">
        <Checkbox
          label="Remember me"
          checked={formData?.rememberMe}
          onChange={(e) => handleInputChange('rememberMe', e?.target?.checked)}
          disabled={isLoading}
        />
        
        <button
          type="button"
          onClick={() => console.log('Forgot password clicked')}
          className="text-sm text-primary hover:text-primary/80 transition-smooth"
          disabled={isLoading}
        >
          Forgot password?
        </button>
      </div>
      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <Icon name="AlertCircle" size={16} className="text-destructive" />
          <span className="text-sm text-destructive">{error}</span>
        </div>
      )}
      {/* Submit Button */}
      <Button
        type="submit"
        variant="default"
        size="lg"
        fullWidth
        loading={isLoading}
        disabled={isLoading}
        iconName="LogIn"
        iconPosition="right"
      >
        Sign In
      </Button>
      {/* Register Link */}
      <div className="text-center">
        <span className="text-sm text-muted-foreground">
          Don't have an account?{' '}
        </span>
        <button
          type="button"
          onClick={() => navigate('/register')}
          className="text-sm text-primary hover:text-primary/80 font-medium transition-smooth"
          disabled={isLoading}
        >
          Create Account
        </button>
      </div>
    </form>
  );
};

export default LoginForm;