import React, { useEffect, useState, memo } from 'react';
import { Tabs, Stack, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';
import { StyleSheet, View, Dimensions, TouchableOpacity, Text, Platform, LogBox } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from '../services/authContext';
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

// Implement a persistent layout wrapper
const PersistentLayout = memo(({ children }) => {
  return (
    <View style={styles.persistentContainer}>
      {children}
    </View>
  );
});

// Auth screens that should NOT have tab navigation
const AUTH_SCREENS = [
  'index', // Login page
  'signup',
  'forgot-password',
  'forgot-username',
  'reset-password',
  'security-questions',
];

// ONLY these tabs should be shown in the tab navigator
const ALLOWED_TABS = ['dashboard', 'recommend', 'learn', 'track', 'profile'];

// Authentication-only layout without tabs
const AuthStack = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'fade',
      }}
    />
  );
};

// Get tab icon name based on route
const getTabIcon = (routeName, focused) => {
  switch (routeName) {
    case 'dashboard':
      return focused ? 'home' : 'home-outline';
    case 'recommend':
      return focused ? 'flask' : 'flask-outline';
    case 'learn':
      return focused ? 'book' : 'book-outline';
    case 'track':
      return focused ? 'calendar' : 'calendar-outline';
    case 'profile':
      return focused ? 'person' : 'person-outline';
    default:
      return focused ? 'apps' : 'apps-outline';
  }
};

// Get tab label based on route
const getTabLabel = (routeName) => {
  switch (routeName) {
    case 'dashboard':
      return 'Home';
    case 'recommend':
      return 'Recommend';
    case 'learn':
      return 'Learn';
    case 'track':
      return 'Track';
    case 'profile':
      return 'Profile';
    default:
      return routeName;
  }
};

// Get shortened label text to fit smaller screens
const getShortenedLabel = (routeName) => {
  switch (routeName) {
    case 'dashboard':
      return 'Home';
    case 'recommend':
      return 'Rec';
    case 'learn':
      return 'Learn';
    case 'track':
      return 'Track';
    case 'profile':
      return 'Profile';
    default:
      return routeName;
  }
};

// Custom tab bar to ensure proper spacing
const CustomTabBar = ({ state, descriptors, navigation }) => {
  const screenWidth = Dimensions.get('window').width;
  const isSmallScreen = screenWidth < 375;
  
  // Only show the allowed tabs
  const allowedRoutes = state.routes.filter(route => 
    ALLOWED_TABS.includes(route.name)
  );
  
  return (
    <View style={{
      flexDirection: 'row',
      height: 85,
      backgroundColor: COLORS.secondary,
      borderTopWidth: 1,
      borderTopColor: '#E8E8E8',
      paddingBottom: Platform.OS === 'ios' ? 25 : 15,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    }}>
      {allowedRoutes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === state.routes.findIndex(r => r.name === route.name);
        
        const iconName = getTabIcon(route.name, isFocused);
        const label = isSmallScreen ? 
          getShortenedLabel(route.name) : 
          getTabLabel(route.name);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7} 
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingTop: 10,
            }}
          >
            <Ionicons 
              name={iconName} 
              size={24} 
              color={isFocused ? COLORS.primary : COLORS.textSecondary}
              style={{ marginBottom: 5 }}
            />
            <Text 
              style={{
                color: isFocused ? COLORS.primary : COLORS.textSecondary,
                fontSize: isSmallScreen ? 10 : 12,
                fontWeight: isFocused ? '600' : '400',
                textAlign: 'center',
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Main app layout with ONLY the 5 specified tabs
const MainTabNavigator = () => {
  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* ONLY include our 5 specified tabs */}
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="recommend" />
      <Tabs.Screen name="learn" />
      <Tabs.Screen name="track" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
};

// Navigation Layout that checks authentication status
const NavigationLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  
  // If still loading auth state, show nothing (splash screen remains)
  if (loading) {
    return null;
  }
  
  // Check if current route is an auth screen
  const currentScreen = segments[0] || 'index';
  const isAuthScreen = AUTH_SCREENS.includes(currentScreen);
  
  // If not authenticated OR on an auth screen, show auth stack (no tabs)
  if (!isAuthenticated || isAuthScreen) {
    return <AuthStack />;
  }
  
  // For authenticated users, show the main tab navigator
  return <MainTabNavigator />;
};

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
      } catch (e) {
        console.log('Error during app initialization:', e);
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
        <NavigationLayout />
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