const API_BASE_URL = 'http://localhost:8000/api/v1';

class AuthService {
  // Register a new user
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Login user
  async login(credentials) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();
      
      // Store token and user data
      this.setAuthToken(data.access_token);
      this.setUserData(data.user);
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Logout user
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('rememberMe');
  }

  // Get current user info
  async getCurrentUser() {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get user info');
      }

      return await response.json();
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  // Set authentication token
  setAuthToken(token) {
    localStorage.setItem('authToken', token);
  }

  // Get authentication token
  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  // Set user data
  setUserData(userData) {
    localStorage.setItem('userData', JSON.stringify(userData));
  }

  // Get user data
  getUserData() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getAuthToken();
    const userData = this.getUserData();
    return !!(token && userData);
  }

  // Check if token is expired (basic check)
  isTokenExpired() {
    const token = this.getAuthToken();
    if (!token) return true;

    try {
      // Basic JWT token expiry check
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true;
    }
  }

  // Get authorization header for API calls
  getAuthHeader() {
    const token = this.getAuthToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Refresh user session
  async refreshSession() {
    try {
      if (this.isTokenExpired()) {
        this.logout();
        throw new Error('Session expired');
      }

      const userData = await this.getCurrentUser();
      this.setUserData(userData);
      return userData;
    } catch (error) {
      this.logout();
      throw error;
    }
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;