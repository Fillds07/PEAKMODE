import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as Network from 'expo-network';

// Use the same token key as auth.service.js
const TOKEN_KEY = 'peakmode_auth_token';
const USER_KEY = 'peakmode_user';

// Determine the API URL dynamically
const determineApiUrl = async () => {
  // First priority: explicit API URL from app config
  if (Constants.expoConfig?.extra?.apiUrl) {
    return Constants.expoConfig.extra.apiUrl;
  }

  // Second priority: Public API host environment variable
  if (Constants.expoConfig?.extra?.expoPublicApiHost) {
    return `http://${Constants.expoConfig.extra.expoPublicApiHost}:5003/api`;
  }

  // Third priority: For development, try to detect local IP address
  try {
    const ip = await Network.getIpAddressAsync();
    if (ip && ip !== '127.0.0.1' && !ip.startsWith('169.254')) {
      return `http://${ip}:5003/api`;
    }
  } catch (error) {
    console.log('Could not determine IP address:', error);
  }

  // Fallback to platform-specific localhost values
  return Platform.OS === 'ios'
    ? 'http://localhost:5003/api'  // iOS simulator can use localhost
    : 'http://10.0.2.2:5003/api';  // Android emulator needs special IP for localhost
};

// Initialize with a temporary URL, will be updated after we can determine the real one
let API_URL = 'http://localhost:5003/api';

// For debugging
console.log('Initial API URL:', API_URL);

// Create axios instance with performance optimizations
const api = axios.create({
  // We'll update the baseURL after initialization
  headers: {
    'Content-Type': 'application/json',
  },
  // Optimize performance
  timeout: 5000, // 5 second timeout
});

// Initialize API URL asynchronously
(async () => {
  try {
    API_URL = await determineApiUrl();
    api.defaults.baseURL = API_URL;
    console.log('Updated API URL:', API_URL);
  } catch (error) {
    console.error('Error determining API URL:', error);
  }
})();

// Request performance optimization 
let pendingRequests = {};

// Add request caching for GET requests
const cache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      // Ensure baseURL is set correctly (in case it was initialized after some requests)
      if (!config.baseURL || config.baseURL !== API_URL) {
        config.baseURL = API_URL;
      }

      // Add cache-busting for profile endpoint to ensure fresh data
      if (config.url?.includes('/users/profile') && config.method === 'get') {
        config.params = { ...config.params, _t: new Date().getTime() };
      }

      // Add auth token
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Return from cache for GET requests if available and not expired
      if (config.method === 'get') {
        const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
        const cachedResponse = cache.get(cacheKey);
        
        if (cachedResponse && (Date.now() - cachedResponse.timestamp < CACHE_DURATION)) {
          // Resolve immediately from cache
          config.adapter = () => {
            return Promise.resolve({
              data: cachedResponse.data,
              status: 200,
              statusText: 'OK',
              headers: cachedResponse.headers,
              config,
              request: {}
            });
          };
        }
      }

      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// Response interceptor for caching and error handling
api.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config.method === 'get' && response.status === 200) {
      const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
      cache.set(cacheKey, {
        data: response.data,
        headers: response.headers,
        timestamp: Date.now()
      });
    }
    return response;
  },
  async (error) => {
    const { response, config } = error;
    
    // Handle token expiration (401 errors) - except during login attempts
    if (response && response.status === 401 && !config.url.includes('/auth/login')) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      clearCache();
    }
    
    return Promise.reject(error);
  }
);

// Clear the cache
const clearCache = () => {
  cache.clear();
};

// Special error class for authentication errors that shouldn't trigger global error reporting
export class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.isHandled = true;
  }
}

// Authentication services
export const authService = {
  // Export API URL for other components to use
  API_URL: API_URL,
  
  // Register a new user
  register: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  // Login user - optimized for speed
  login: async (credentials) => {
    try {
      // Clear cache on login
      clearCache();
      
      const response = await api.post('/auth/login', credentials);
      const { token, data } = response.data;
      
      // Store token and user data in parallel
      if (token && data?.user) {
        await Promise.all([
          SecureStore.setItemAsync(TOKEN_KEY, token),
          SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user))
        ]);
      }
      
      return data.user;
    } catch (error) {
      // Handle specific error cases with user-friendly messages
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        
        if (status === 401) {
          throw new AuthenticationError('Incorrect username or password');
        } else if (status === 400) {
          throw new AuthenticationError(errorData?.message || 'Please enter valid credentials');
        } else if (status >= 500) {
          throw new Error('Server error. Please try again later');
        } else {
          throw new Error(errorData?.message || 'Login failed');
        }
      } else if (error.request) {
        throw new Error('Cannot connect to server. Please check your network connection');
      } else {
        throw error;
      }
    }
  },

  // Logout user - optimized for speed
  logout: async () => {
    try {
      // Clear cache on logout
      clearCache();
      
      // Remove tokens in parallel
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY),
        SecureStore.deleteItemAsync(USER_KEY)
      ]);
      
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  },

  // Request password reset
  forgotPassword: async (payload) => {
    try {
      const response = await api.post('/auth/forgotPassword', payload);
      return response.data;
    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data?.message || 'Failed to request password reset';
        throw new Error(errorMessage);
      } else if (error.request) {
        throw new Error('No response received from server. Please check your network connection.');
      } else {
        throw error;
      }
    }
  },

  // Reset password with token
  resetPassword: async (token, password) => {
    try {
      const cleanToken = token.trim();
      
      const response = await api.patch('/auth/resetPassword', { 
        token: cleanToken, 
        password 
      });
      
      return response.data;
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        
        if (status === 400) {
          // Token validation issues (expired, invalid)
          const message = errorData?.message || 'Token validation failed';
          error.tokenExpired = message.includes('expired') || message.includes('invalid');
          throw error;
        } else if (status === 401) {
          throw new Error('Authentication error. Please login again.');
        } else if (status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(errorData?.message || 'Password reset failed');
        }
      } else if (error.request) {
        throw new Error('No response received from server. Please check your network connection.');
      } else {
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
  // Get current user profile - optimized with caching and fallback
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      
      // Store fresh user data in secure storage as backup
      if (response?.data?.data?.user) {
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      
      // Try to get cached user data if API fails
      try {
        const userJson = await SecureStore.getItemAsync(USER_KEY);
        if (userJson) {
          const userData = JSON.parse(userJson);
          return { 
            status: 'success', 
            data: { user: userData },
            cached: true 
          };
        }
      } catch (storageError) {
        console.error('Error fetching user from storage:', storageError);
      }
      
      throw error;
    }
  },

  // Update user profile - optimized to update local cache
  updateProfile: async (profileData) => {
    try {
      const response = await api.patch('/users/profile', profileData);
      
      // Update local cache
      if (response?.data?.data?.user) {
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.data.data.user));
      }
      
      // Clear API cache to ensure fresh data
      clearCache();
      
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

  // Delete user account - optimized
  deleteAccount: async () => {
    try {
      const response = await api.delete('/users/profile');
      
      // Clear all local data
      clearCache();
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY),
        SecureStore.deleteItemAsync(USER_KEY)
      ]);
      
      return response.data;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }
};

export default api; 