import React, { createContext, useState, useEffect, useContext } from 'react';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { authService } from './api';

const TOKEN_KEY = 'peakmode_auth_token';
const USER_KEY = 'peakmode_user';

// Create context
const AuthContext = createContext(null);

// Provider component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth status when app loads
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Check if the user is authenticated
  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      
      if (token) {
        // We have a token, but also verify if it's valid
        try {
          // Try to get user data
          const userJson = await SecureStore.getItemAsync(USER_KEY);
          if (userJson) {
            setUser(JSON.parse(userJson));
          }
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error loading user data:', error);
          await logout(); // Force logout if any error
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      const userData = await authService.login(credentials);
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      // Make sure to properly rethrow the error to propagate it to the component
      console.log('Auth context login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      router.replace('/'); // Navigate to login
    } finally {
      setLoading(false);
    }
  };

  // Update user profile data
  const updateUser = (userData) => {
    setUser(userData);
  };

  // Context value
  const contextValue = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    updateUser,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC to require authentication
export const withAuth = (Component) => {
  return (props) => {
    const { isAuthenticated, loading } = useAuth();
    
    useEffect(() => {
      // If not authenticated and finished loading, redirect to login
      if (!loading && !isAuthenticated) {
        router.replace('/');
      }
    }, [isAuthenticated, loading]);
    
    // If still loading or not authenticated, don't render the component
    if (loading || !isAuthenticated) {
      return null;
    }
    
    // Otherwise, render the protected component
    return <Component {...props} />;
  };
};

export default AuthContext; 