import React, { useEffect, useState, memo } from 'react';
import { Tabs, Stack, router, usePathname } from 'expo-router';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';
import { StatusBar, StyleSheet, View, ActivityIndicator, Animated, LogBox } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider } from '../services/authContext';
import connectivityService from '../services/connectivity';
import errorSuppressor from '../services/errorSuppressor';

// Import global CSS for hiding error overlays
import './global.css';

// PEAKMODE color theme based on logo
const COLORS = {
  primary: '#F7B233', // Yellow/orange from logo
  secondary: '#FFFFFF', // White for background
  text: '#333333', // Dark text
  textSecondary: '#777777', // Secondary text
  background: '#F5F5F5', // Light gray background
  cardBg: '#FFFFFF', // White background for cards
  inputBg: '#F9F9F9', // Light gray for input backgrounds
  border: '#DDDDDD', // Light gray for borders
  error: '#FF6B6B', // Red for errors
  success: '#4CAF50', // Green for success
}

// Completely suppress the error overlay so we can handle all errors in our UI
if (global.ErrorUtils) {
  const originalGlobalHandler = global.ErrorUtils.getGlobalHandler();
  
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    // Convert to a handled error to prevent overlay
    const handledError = new errorSuppressor.HandledError(error.message);
    
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Error captured by global handler:', error.message);
    }
    
    // Don't call the original handler, which would show the overlay
  });
}

// Replace the console.error function to prevent error overlays
const originalConsoleError = console.error;
console.error = (...args) => {
  // Handle the error safely
  errorSuppressor.handleError(
    args[0] instanceof Error ? args[0] : new Error(args.join(' '))
  );
};

// Ignore all warning logs to prevent yellow boxes
LogBox.ignoreAllLogs();

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

// Implement a persistent layout wrapper to prevent flashing
const PersistentLayout = memo(({ children }) => {
  // Initialize error suppression
  useEffect(() => {
    return errorSuppressor.initializeErrorSuppression();
  }, []);
  
  return (
    <View style={styles.persistentContainer}>
      {children}
    </View>
  );
});

// App layout with preloading and persistent container
export default function RootLayout() {
  // Track app initialization to prevent flashing
  const [appIsReady, setAppIsReady] = useState(false);
  
  // Preload critical data and fonts
  const [fontsLoaded] = useFonts({
    // Add your fonts here if needed
  });
  
  // Preload all necessary app resources before showing any content
  useEffect(() => {
    async function prepare() {
      try {
        // Initialize error suppression
        errorSuppressor.hideErrorOverlays();
        
        // Preload network connectivity status
        await connectivityService.checkBackendConnectivity();
        
        // Wait for fonts to load
        await SplashScreen.preventAutoHideAsync();
        
        // Add any additional preloading here
      } catch (e) {
        // Safely handle error without overlay
        errorSuppressor.handleError(e);
      } finally {
        // Mark app as ready
        setAppIsReady(true);
        SplashScreen.hideAsync();
      }
    }
    
    prepare();
  }, []);

  // Keep splash screen visible while app is not ready
  if (!appIsReady || !fontsLoaded) {
    return null; // This keeps the splash screen visible
  }

  return (
    <AuthProvider>
      <PersistentLayout>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
            animation: 'fade', // Use fade transition to prevent jarring changes
          }}
        />
      </PersistentLayout>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  persistentContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Match your app's background color
  },
}); 