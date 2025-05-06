import axios from 'axios';
import { Platform } from 'react-native';
import * as Network from 'expo-network';
import Constants from 'expo-constants';

// API URLs for different environments
const PRODUCTION_API_URL = 'https://peakmode-backend.eba-6pcej9t8.us-east-1.elasticbeanstalk.com/api';

// For local development
const LOCAL_DEV_API_URL = Platform.OS === 'ios' 
  ? 'http://192.168.1.185:5002/api'  // Use your computer's IP address
  : 'http://10.0.2.2:5002/api';       // Special Android emulator IP for localhost

// Get API URL - use local development for now
const API_URL = Constants.expoConfig?.extra?.apiUrl || LOCAL_DEV_API_URL;

// For debugging
console.log('Connectivity service using API URL:', API_URL);

// Simple throttle to prevent too many checks
let lastCheckTime = 0;
let lastCheckResult = null;
const THROTTLE_TIME = 5000; // 5 seconds

/**
 * Check if the device has internet connectivity
 * @returns {Promise<boolean>} True if connected to internet
 */
export const checkInternetConnectivity = async () => {
  const now = Date.now();
  
  // Return cached result if we checked recently
  if (now - lastCheckTime < THROTTLE_TIME && lastCheckResult !== null) {
    return lastCheckResult;
  }
  
  try {
    // Use expo-network to check network state
    const networkState = await Network.getNetworkStateAsync();
    
    // Early return if network is clearly not connected
    if (!networkState.isConnected) {
      lastCheckTime = now;
      lastCheckResult = false;
      return false;
    }
    
    // Even if networkState.isInternetReachable is false, we'll double check
    if (!networkState.isInternetReachable) {
      try {
        // Try to reach Google as a reliable internet endpoint
        await axios.get('https://www.google.com', { 
          timeout: 5000 
        });
        
        // If we get here, internet is actually reachable
        lastCheckTime = now;
        lastCheckResult = true;
        return true;
      } catch (error) {
        // Confirmed no internet
        lastCheckTime = now;
        lastCheckResult = false;
        return false;
      }
    }
    
    // Network state says we're connected to internet
    lastCheckTime = now;
    lastCheckResult = true;
    return true;
  } catch (error) {
    console.log('Internet connectivity check failed:', error.message);
    lastCheckTime = now;
    lastCheckResult = false;
    return false;
  }
};

/**
 * Check if the backend API is reachable
 * @param {number} retries - Number of retries (default: 2)
 * @param {number} timeoutMs - Timeout in milliseconds (default: 10000)
 * @returns {Promise<object>} Status object
 */
export const checkBackendConnectivity = async (retries = 2, timeoutMs = 10000) => {
  try {
    // First check if we have internet
    const hasInternet = await checkInternetConnectivity();
    if (!hasInternet) {
      return {
        isConnected: false,
        error: 'No internet connection',
        mongoDBConnected: false,
        details: null
      };
    }
    
    // Try to connect with retries
    let lastError = null;
    let attempt = 0;
    
    while (attempt <= retries) {
      try {
        console.log(`Backend connectivity check attempt ${attempt + 1}/${retries + 1}`);
        
        // Using Promise.race for timeout handling
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), timeoutMs)
        );
        
        const fetchPromise = axios.get(`${API_URL}/health`);
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        return {
          isConnected: true,
          status: response.data.status,
          mongoDBConnected: response.data.mongoDBStatus === 'connected',
          details: response.data
        };
      } catch (error) {
        lastError = error;
        console.log(`Backend connectivity attempt ${attempt + 1} failed:`, error.message);
        
        // Increase wait time between retries (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        attempt++;
      }
    }
    
    // All retries failed
    console.log('Backend connectivity check failed after all retries');
    return {
      isConnected: false,
      error: lastError?.message || 'Connection failed after multiple attempts',
      details: null
    };
  } catch (error) {
    console.log('Backend connectivity check failed:', error.message);
    return {
      isConnected: false,
      error: error.message,
      details: null
    };
  }
};

/**
 * Check if database connection is active
 * @returns {Promise<boolean>} True if database is connected
 */
export const checkDatabaseConnectivity = async () => {
  try {
    // First check if backend is reachable
    const backendStatus = await checkBackendConnectivity();
    if (!backendStatus.isConnected) {
      return {
        isConnected: false,
        error: 'Backend not reachable',
        details: null
      };
    }
    
    const response = await axios.get(`${API_URL}/monitor/db`, { 
      timeout: 10000 
    });
    
    return {
      isConnected: response.data.status === 'ok',
      collections: response.data.collections || [],
      details: response.data
    };
  } catch (error) {
    console.log('Database connectivity check failed:', error.message);
    return {
      isConnected: false,
      error: error.message,
      details: null
    };
  }
};

/**
 * Comprehensive connectivity check
 * @returns {Promise<object>} Complete connectivity status
 */
export const runConnectivityDiagnostics = async () => {
  const hasInternet = await checkInternetConnectivity();
  let backendStatus = { isConnected: false };
  let dbStatus = { isConnected: false };
  
  if (hasInternet) {
    backendStatus = await checkBackendConnectivity();
    
    if (backendStatus.isConnected) {
      dbStatus = await checkDatabaseConnectivity();
    }
  }
  
  return {
    timestamp: new Date().toISOString(),
    device: {
      platform: Platform.OS,
      version: Platform.Version,
      isConnected: hasInternet
    },
    backend: backendStatus,
    database: dbStatus,
    apiEndpoint: API_URL
  };
};

export default {
  checkInternetConnectivity,
  checkBackendConnectivity,
  checkDatabaseConnectivity,
  runConnectivityDiagnostics
}; 