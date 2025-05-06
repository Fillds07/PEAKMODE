import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Use the same token key as auth.service.js
const TOKEN_KEY = 'peakmode_auth_token';
const USER_KEY = 'peakmode_user';

// Local development API URL handling
const LOCAL_DEV_API_URL = Platform.OS === 'ios' 
  ? 'http://192.168.1.185:5002/api'  // Use your computer's IP address
  : 'http://10.0.2.2:5002/api';       // Special Android emulator IP for localhost

// Production API URL
const PRODUCTION_API_URL = 'https://peakmode-backend.eba-6pcej9t8.us-east-1.elasticbeanstalk.com/api';

// Get API URL from the app config or use local development by default for now
const API_URL = Constants.expoConfig?.extra?.apiUrl || LOCAL_DEV_API_URL;

// For debugging
console.log('Using API URL:', API_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Added token to request:', config.url);
      } else {
        console.log('No token available for request:', config.url);
      }
    } catch (error) {
      console.error('Error retrieving token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common error scenarios
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    
    // Handle token expiration (401 errors) - except during login attempts
    if (response && response.status === 401 && !config.url.includes('/auth/login')) {
      console.log('401 Unauthorized response received, clearing tokens');
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      // You may want to redirect to login screen here
    }
    
    return Promise.reject(error);
  }
);

// Special error class for authentication errors that shouldn't trigger global error reporting
class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    // This special flag helps identify this as a "handled" error that shouldn't be shown in global reporting
    this.isHandled = true;
  }
}

// Authentication services
export const authService = {
  // Register a new user
  register: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, data } = response.data;
      
      // Store the token securely
      if (token) {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        
        // Also store user data
        if (data && data.user) {
          await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
        }
      }
      
      return data.user;
    } catch (error) {
      // Only log unexpected errors, not authentication errors
      if (!error.response || error.response.status !== 401) {
        console.error('Error in login:', error);
      }
      
      // Handle specific error cases with user-friendly messages
      if (error.response) {
        // The request was made and the server responded with an error status
        const status = error.response.status;
        const errorData = error.response.data;
        
        // Authentication error (wrong credentials)
        if (status === 401) {
          throw new AuthenticationError('Incorrect username or password');
        } 
        // Bad request (missing fields)
        else if (status === 400) {
          throw new AuthenticationError(errorData?.message || 'Please enter valid credentials');
        }
        // Server error
        else if (status >= 500) {
          throw new Error('Server error. Please try again later');
        }
        // Any other error
        else {
          throw new Error(errorData?.message || 'Login failed');
        }
      } 
      // Network error or server not responding
      else if (error.request) {
        throw new Error('Cannot connect to server. Please check your network connection');
      } 
      // Other errors
      else {
        throw error;
      }
    }
  },

  // Logout user
  logout: async () => {
    try {
      console.log('Logging out user, removing tokens');
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  },

  // Request password reset
  forgotPassword: async (payload) => {
    // payload can contain either email or username
    try {
      const response = await api.post('/auth/forgotPassword', payload);
      return response.data;
    } catch (error) {
      console.error('Error in forgotPassword:', error);
      
      // Rethrow with enhanced error details
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const errorMessage = error.response.data?.message || 'Failed to request password reset';
        throw new Error(errorMessage);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response received from server. Please check your network connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw error;
      }
    }
  },

  // Reset password with token
  resetPassword: async (token, password) => {
    try {
      console.log('API: Attempting to reset password with token:', token);
      
      // Make sure token is clean
      const cleanToken = token.trim();
      
      const response = await api.patch('/auth/resetPassword', { 
        token: cleanToken, 
        password 
      });
      
      console.log('Password reset success');
      return response.data;
    } catch (error) {
      console.error('Error in resetPassword:', error);
      
      // Enhance error handling with more specific messages
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const errorData = error.response.data;
        
        console.log('Reset password error status:', status);
        console.log('Reset password error data:', errorData);
        
        if (status === 400) {
          // Token validation issues (expired, invalid)
          const message = errorData?.message || 'Token validation failed';
          console.log('Token validation failed with message:', message);
          error.tokenExpired = message.includes('expired') || message.includes('invalid');
          throw error;
        } else if (status === 401) {
          throw new Error('Authentication error. Please login again.');
        } else if (status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          // For any other error status
          throw new Error(errorData?.message || 'Password reset failed');
        }
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response received from server. Please check your network connection.');
      } else {
        // Something happened in setting up the request
        throw error;
      }
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    return !!token;
  },
};

// User profile services
export const userService = {
  // Get current user profile
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.patch('/users/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await api.patch('/users/change-password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  },

  // Delete user account
  deleteAccount: async () => {
    try {
      console.log('Attempting to delete user account');
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Make a direct fetch call with the token to ensure it's included
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete account: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Clear tokens after successful deletion
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      
      return data;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }
};

export default api; 