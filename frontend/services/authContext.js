import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { authService } from './api';
import { View, ActivityIndicator, Text } from 'react-native';

// Only need user key now
const USER_KEY = 'peakmode_user';

// Create context
const AuthContext = createContext(null);

// Provider component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Keep track of auth operations to prevent UI flashing
  const authOperationInProgress = useRef(false);

  // Check auth status when app loads
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Check if the user is authenticated
  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      
      // Check if user data exists
      const userJson = await SecureStore.getItemAsync(USER_KEY);
      
      if (userJson) {
        // We have user data
        try {
          setUser(JSON.parse(userJson));
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing user data:', error);
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

  // Login function - optimized with useCallback
  const login = useCallback(async (credentials) => {
    // Set flag to indicate auth operation is in progress
    authOperationInProgress.current = true;
    
    try {
      setLoading(true);
      console.log("Login attempt for:", credentials.username);
      
      // Get user data from API
      const userData = await authService.login(credentials);
      console.log("Login successful, user data received:", JSON.stringify(userData));
      
      // Set authentication state
      setUser(userData);
      setIsAuthenticated(true);
      
      // Give UI a moment to update before navigation
      setTimeout(() => {
        console.log("Navigating to profile page...");
        
        // Force navigation to profile
        try {
          router.replace('/profile');
          console.log("Navigation to profile executed");
        } catch (error) {
          console.error("Navigation error:", error);
          // Try again once more if it fails
          setTimeout(() => {
            try {
              router.replace('/profile');
            } catch (fallbackError) {
              console.error("Fallback navigation failed:", fallbackError);
            }
          }, 100);
        }
      }, 50);
      
      return userData;
    } catch (error) {
      console.log('Auth context login error:', error);
      throw error;
    } finally {
      setLoading(false);
      authOperationInProgress.current = false;
    }
  }, []);

  // Logout function - optimized with useCallback
  const logout = useCallback(async () => {
    // Set flag to indicate auth operation is in progress
    authOperationInProgress.current = true;
    
    try {
      setLoading(true);
      await authService.logout();
      
      // Batch state updates to minimize re-renders
      setUser(null);
      setIsAuthenticated(false);
      
      // Only navigate after state is updated
      router.replace('/');
    } finally {
      setLoading(false);
      // Clear the auth operation flag
      authOperationInProgress.current = false;
    }
  }, []);

  // Update user profile data - optimized with useCallback
  const updateUser = useCallback((userData) => {
    setUser(userData);
  }, []);

  // Context value - memoized to prevent unnecessary context re-renders
  const contextValue = React.useMemo(() => ({
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    updateUser,
    checkAuthStatus,
    authOperationInProgress: authOperationInProgress.current
  }), [isAuthenticated, user, loading, login, logout, updateUser, checkAuthStatus]);

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
    const { isAuthenticated, loading, user } = useAuth();
    
    console.log("withAuth HOC - Auth state:", { 
      isAuthenticated, 
      loading, 
      hasUser: !!user 
    });
    
    useEffect(() => {
      // If not authenticated and finished loading, redirect to login
      if (!loading && !isAuthenticated) {
        console.log("withAuth - Not authenticated, redirecting to login");
        router.replace('/');
      } else if (!loading && isAuthenticated) {
        console.log("withAuth - User is authenticated, allowing access to protected route");
      }
    }, [isAuthenticated, loading]);
    
    // If still loading, show a loading indicator
    if (loading) {
      console.log("withAuth - Still loading auth state");
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#F7B233" />
          <Text style={{ marginTop: 10 }}>Loading...</Text>
        </View>
      );
    }
    
    // If not authenticated, don't render anything while redirecting
    if (!isAuthenticated) {
      console.log("withAuth - Not rendering protected component");
      return null;
    }
    
    // Otherwise, render the protected component
    console.log("withAuth - Rendering protected component");
    return <Component {...props} />;
  };
};

export default AuthContext; 