import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

// Prevent duplicate error messages for authentication errors
// This silences the red/black error overlay for authentication errors that we already handle in the UI
if (global.ErrorUtils) {
  const originalGlobalHandler = global.ErrorUtils.getGlobalHandler();
  
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    // Check if this is an authentication error (which we already handle in the UI)
    const isAuthError = error.name === 'AuthenticationError' || 
                        (error.isHandled === true) ||
                        (error.message && (
                          error.message.includes('Incorrect username or password') ||
                          error.message.includes('Invalid credentials')
                        ));
                        
    if (isAuthError) {
      // Don't show the error overlay for auth errors
      console.log('Suppressing global error report for auth error:', error.message);
      return;
    }
    
    // For all other errors, use the original handler
    originalGlobalHandler(error, isFatal);
  });
}

// Ignore specific warning messages
LogBox.ignoreLogs([
  'Incorrect username or password',
  'Invalid credentials'
]);

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // Add any custom fonts here if needed
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Once fonts are loaded (or an error occurred), hide the splash screen
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // If the fonts haven't loaded and there's no error, return null to show the splash screen
  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Show the app once everything is loaded
  return (
    <>
      <StatusBar style="dark" />
      <Tabs 
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarStyle: {
            backgroundColor: COLORS.cardBg,
            borderTopColor: COLORS.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 5,
            height: 60,
            paddingBottom: 6,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          }
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="supplements"
          options={{
            title: "Supplements",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="flask-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: "Progress",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="trending-up-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" color={color} size={size} />
            ),
          }}
        />
        {/* Hide auth screens from the tab bar */}
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="signup"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="forgot-password"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="reset-password"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </>
  );
} 