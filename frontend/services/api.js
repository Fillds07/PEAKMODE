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

// Request interceptor to add username for authentication
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

      // Add username to headers for authentication
      const userJson = await SecureStore.getItemAsync(USER_KEY);
      if (userJson) {
        const userData = JSON.parse(userJson);
        if (userData.username) {
          config.headers.username = userData.username;
        }
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
    
    // Handle authentication errors - except during login attempts
    if (response && response.status === 401 && !config.url.includes('/auth/login')) {
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
    this.isAuthError = true; // Add a flag to easily identify auth errors
    this.shouldNotCauseFlash = true; // Special flag to prevent UI flashing
  }
}

// Authentication services
export const authService = {
  // Export API URL for other components to use
  API_URL: API_URL,
  
  // Track recent auth errors to prevent duplicates causing flashes
  recentAuthErrors: new Set(),
  
  // Register a new user
  register: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  // Login user - optimized for speed and smooth transitions
  login: async (credentials) => {
    try {
      // Clear cache on login
      clearCache();
      
      console.log("API: Login request for user:", credentials.username);
      const response = await api.post('/auth/login', credentials);
      console.log("API: Login response received:", JSON.stringify(response.data));
      
      // Add defensive validation
      if (!response.data) {
        console.error("API: Login response missing data");
        throw new Error("Invalid server response");
      }

      // Updated to match new backend response format without tokens
      if (!response.data.data || !response.data.data.user) {
        console.error("API: Login response missing user data");
        throw new Error("User data missing from response");
      }
      
      const userData = response.data.data.user;
      console.log("API: Login successful, saving user data");
      
      // Store user data
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
      console.log("API: User data saved successfully");
      
      // Clear any recent auth errors on success
      authService.recentAuthErrors.clear();
      
      return userData;
    } catch (error) {
      // Handle error here
      // Check if this is a duplicate error that might cause UI flash
      const errorKey = `${credentials.username}:${error.message || 'generic-error'}`;
      const isDuplicateError = authService.recentAuthErrors.has(errorKey);
      
      // Handle specific error cases with user-friendly messages
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        
        let errorMessage = '';
        let isAuthError = true;
        
        if (status === 401) {
          errorMessage = 'Incorrect username or password';
        } else if (status === 400) {
          errorMessage = errorData?.message || 'Please enter valid credentials';
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later';
          isAuthError = false;
          throw new Error(errorMessage);
        } else {
          errorMessage = errorData?.message || 'Login failed';
          isAuthError = false;
          throw new Error(errorMessage);
        }
        
        // Use AuthenticationError for auth-related errors to prevent flash
        const authError = new AuthenticationError(errorMessage);
        
        // Add additional context for smoother UI handling
        authError.statusCode = status;
        authError.isAuthError = true;
        authError.isDuplicate = isDuplicateError;
        
        // Track this error to prevent duplicates causing flashes
        authService.recentAuthErrors.add(errorKey);
        
        // Set a timeout to eventually clean up the error cache
        setTimeout(() => {
          authService.recentAuthErrors.delete(errorKey);
        }, 5000); // 5 second cache
        
        throw authError;
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
      
      // Remove user data
      await SecureStore.deleteItemAsync(USER_KEY);
      
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  },

  // Get security questions for a user
  getUserSecurityQuestions: async (username) => {
    try {
      console.log('Making API request to /auth/get-security-questions with username:', username);
      // Changed from GET to POST and sending username in the request body
      const response = await api.post('/auth/get-security-questions', { username });
      console.log('Raw security questions response:', JSON.stringify(response.data));
      
      return {
        error: false,
        data: response.data
      };
    } catch (error) {
      console.log('API error in getUserSecurityQuestions:', error.message);
      if (error.response) {
        console.log('Error response status:', error.response.status);
        console.log('Error response data:', JSON.stringify(error.response.data));
      }
      
      // Instead of logging to console, just return the error in a structured way
      return {
        error: true,
        data: {
          message: error.response?.data?.message || error.message || 'User not found'
        }
      };
    }
  },

  // Verify security answers
  verifySecurityAnswers: async (data) => {
    try {
      const response = await api.post('/auth/verify-security-answers', data);
      return {
        error: false,
        data: response.data
      };
    } catch (error) {
      // Return error object instead of throwing
      return {
        error: true,
        data: {
          message: error.response?.data?.message || error.message || 'Failed to verify answers'
        }
      };
    }
  },

  // Reset password with security verification (no token needed)
  resetPasswordWithToken: async (username, newPassword) => {
    try {
      console.log('Making API request to /auth/reset-password with:', { username, newPassword: '******' });
      const response = await api.post('/auth/reset-password', {
        username,
        newPassword
      });
      console.log('Raw reset password response:', JSON.stringify(response.data));
      
      return {
        error: false,
        data: response.data
      };
    } catch (error) {
      console.log('API error in resetPassword:', error.message);
      if (error.response) {
        console.log('Error response status:', error.response.status);
        console.log('Error response data:', JSON.stringify(error.response.data));
      }
      
      // Return error object instead of throwing
      return {
        error: true,
        data: {
          message: error.response?.data?.message || error.message || 'Failed to reset password'
        }
      };
    }
  },

  // Find username by email
  findUsername: async (data) => {
    try {
      console.log('Making API request to /auth/find-username with data:', JSON.stringify(data));
      const response = await api.post('/auth/find-username', data);
      console.log('Raw API response:', JSON.stringify(response.data));
      
      // If API call is successful, return the response in the expected format
      return {
        error: false,
        data: response.data // This maintains the original format that the components expect
      };
    } catch (error) {
      console.log('API error in findUsername:', error.message);
      if (error.response) {
        console.log('Error response status:', error.response.status);
        console.log('Error response data:', JSON.stringify(error.response.data));
      }
      
      // Return error object instead of throwing
      return {
        error: true,
        data: {
          message: error.response?.data?.message || error.message || 'No account found with this email'
        }
      };
    }
  },

  // Request password reset - Now uses security question flow
  forgotPassword: async (username) => {
    try {
      // This is now just a wrapper around getUserSecurityQuestions to maintain compatibility
      return await authService.getUserSecurityQuestions(username);
    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data?.message || 'Failed to begin password reset';
        throw new Error(errorMessage);
      } else if (error.request) {
        throw new Error('No response received from server. Please check your network connection.');
      } else {
        throw error;
      }
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    const userJson = await SecureStore.getItemAsync(USER_KEY);
    return !!userJson;
  },
};

// User profile services
export const userService = {
  // Get current user profile - optimized with caching and fallback
  getProfile: async () => {
    try {
      // Get the current username from storage
      const userJson = await SecureStore.getItemAsync(USER_KEY);
      if (!userJson) {
        throw new Error("User not logged in");
      }
      
      const userData = JSON.parse(userJson);
      console.log("Getting profile for user:", userData.username);
      
      // Include username in query parameters
      const response = await api.get('/users/profile', {
        params: { 
          username: userData.username,
          _t: Date.now() // Cache busting
        }
      });
      
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
      // Get the current username for the auth header
      const userJson = await SecureStore.getItemAsync(USER_KEY);
      if (!userJson) {
        throw new Error("User not logged in");
      }
      
      const userData = JSON.parse(userJson);
      const currentUsername = userData.username;
      
      console.log('DEBUG: Updating profile with current username in headers:', currentUsername);
      console.log('DEBUG: Profile data being sent:', JSON.stringify(profileData));
      
      // Force username from headers for authentication - crucial for username changes
      const response = await api.patch('/users/profile', profileData, {
        headers: {
          'Content-Type': 'application/json',
          'username': currentUsername // This ensures we authenticate with current username
        }
      });
      
      console.log('DEBUG: Profile update response:', JSON.stringify(response.data));
      
      // Critical: Update local cache with new user data
      if (response?.data?.data?.user) {
        const updatedUser = response.data.data.user;
        console.log('DEBUG: Updating local storage with new user data:', JSON.stringify(updatedUser));
        
        // Save the updated user info to secure storage
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
        
        // If username was changed, clear the cache to ensure fresh data on next load
        if (profileData.username && profileData.username !== currentUsername) {
          console.log('DEBUG: Username changed - clearing cache');
          clearCache();
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('DEBUG: Error updating profile:', error);
      console.error('DEBUG: Error details:', error.response?.data || 'No error response data');
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
      await SecureStore.deleteItemAsync(USER_KEY);
      
      return response.data;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },

  // Get user's security questions
  getUserSecurityQuestions: async () => {
    try {
      const response = await api.get('/users/security-questions');
      return {
        error: false,
        data: response.data
      };
    } catch (error) {
      console.error('Error getting security questions:', error);
      return {
        error: true,
        data: {
          message: error.response?.data?.message || 'Failed to fetch security questions'
        }
      };
    }
  },
  
  // Update security questions
  updateSecurityQuestions: async (data) => {
    try {
      const response = await api.post('/users/security-questions', data);
      return response.data;
    } catch (error) {
      console.error('Error updating security questions:', error);
      throw error;
    }
  },
};

export default api; 