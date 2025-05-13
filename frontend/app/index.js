import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { authService, AuthenticationError } from '../services/api';
import connectivityService from '../services/connectivity';
import { DismissKeyboardView } from '../services/keyboardUtils';
import Logo from '../services/logoComponent';
import { useAuth, AuthProvider } from '../services/authContext';
import { useTheme } from '../services/themeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StandardError from '../services/ErrorDisplay';
import TransitionWrapper, { SlideTransition } from '../services/TransitionWrapper';
import ThemeToggle from '../components/ThemeToggle';

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

// Keys for local storage
const ERROR_STORAGE_KEY = '@peakmode_login_error';
const USERNAME_STORAGE_KEY = '@peakmode_username';
const IS_NEW_SESSION_KEY = '@peakmode_is_new_session';
const PAGE_NAVIGATION_FLAG = '@peakmode_navigation_flag';

// Constants for animation timing - optimized for smooth transitions
const STAGGER_DELAY = 40; // Reduced from 50ms for faster sequential animations
const INPUT_TIMING = 220; // Consistent timing for all elements

// Persistent error component that stays mounted
const PersistentError = memo(({ error, isNetworkError, checkConnectivity }) => {
  const { colors } = useTheme();
  
  return (
    <View style={styles.errorContainer}>
      <StandardError 
        message={error}
        showRetry={isNetworkError}
        onRetry={checkConnectivity}
        style={styles.errorMargin}
        textColor={colors.error}
      />
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary rerenders
  return prevProps.error === nextProps.error && 
         prevProps.isNetworkError === nextProps.isNetworkError;
});

// Mock auth hook for when the real one is not available
const useAuthFallback = () => {
  // This provides a safe fallback implementation that won't crash
  return {
    login: async () => {
      console.log('Using fallback auth - no real authentication will happen');
      throw new Error('Authentication context not available');
    },
    isAuthenticated: false,
    loading: false,
    user: null,
  };
};

// Actual login screen component
function LoginScreen() {
  // Get URL parameters
  const params = useLocalSearchParams();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  
  // State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isNetworkError, setIsNetworkError] = useState(false);
  
  // Add a ref to track if component is mounted to prevent setState after unmount
  const isMountedRef = useRef(true);
  const hasAttemptedLoginRef = useRef(false);
  
  // Animation refs - subtle animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const usernameAnim = useRef(new Animated.Value(0)).current;
  const passwordAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const dividerAnim = useRef(new Animated.Value(0)).current;
  const createAccountAnim = useRef(new Animated.Value(0)).current;
  const forgotPasswordAnim = useRef(new Animated.Value(0)).current;
  
  // Try to use the real auth hook, or fall back to the mock one
  let auth;
  try {
    console.log('Attempting to get auth context');
    auth = useAuth();
    console.log('Auth context retrieved:', !!auth);
  } catch (error) {
    console.error('Error getting auth context:', error);
    auth = null;
  }
  
  // Get login function or use fallback
  const { login: authLogin } = auth || useAuthFallback();
  console.log('Login function available:', !!authLogin);
  
  // Memoize error state management to prevent rerenders
  const setErrorSafely = useCallback(async (newError, isNetwork = false) => {
    if (!isMountedRef.current) return;
    
    // Don't reset to same error to avoid flash
    if (error === newError) return;
    
    setError(newError);
    setIsNetworkError(isNetwork);
    
    if (newError) {
      await AsyncStorage.setItem(ERROR_STORAGE_KEY, newError);
    } else {
      await AsyncStorage.removeItem(ERROR_STORAGE_KEY);
    }
  }, [error]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      console.log('Login page unmounted');
    };
  }, []);
  
  // Animate elements when component mounts
  useEffect(() => {
    if (isInitialized && !checkingConnection) {
      // Initial fade in of the entire content
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic), // Add easing for smoother animation
      }).start();
      
      // Staggered animation of individual elements - optimized for 120fps feel
      Animated.stagger(STAGGER_DELAY, [
        Animated.timing(logoAnim, {
          toValue: 1,
          duration: INPUT_TIMING,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(usernameAnim, {
          toValue: 1,
          duration: INPUT_TIMING,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(passwordAnim, {
          toValue: 1,
          duration: INPUT_TIMING,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(buttonAnim, {
          toValue: 1,
          duration: INPUT_TIMING,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(dividerAnim, {
          toValue: 1,
          duration: INPUT_TIMING,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(createAccountAnim, {
          toValue: 1,
          duration: INPUT_TIMING,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(forgotPasswordAnim, {
          toValue: 1,
          duration: INPUT_TIMING,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start();
    }
  }, [isInitialized, checkingConnection]);
  
  // Clear error only once when returning to this page via navigation
  useFocusEffect(
    React.useCallback(() => {
      async function checkNavigation() {
        const hasNavigated = await AsyncStorage.getItem(PAGE_NAVIGATION_FLAG);
        
        if (hasNavigated === 'true') {
          // Clear error since we're returning from another page
          setError('');
          await AsyncStorage.removeItem(ERROR_STORAGE_KEY);
          await AsyncStorage.setItem(PAGE_NAVIGATION_FLAG, 'false');
        }
      }
      
      checkNavigation();
    }, [])
  );
  
  // Load saved state on mount
  useEffect(() => {
    async function loadSavedState() {
      try {
        // Check if this is a completely new session
        const isNewSession = await AsyncStorage.getItem(IS_NEW_SESSION_KEY);
        
        if (isNewSession === null) {
          // First time app is opened - clear everything
          console.log('New session - clearing all state');
          await AsyncStorage.setItem(IS_NEW_SESSION_KEY, 'false');
          await AsyncStorage.removeItem(ERROR_STORAGE_KEY);
          await AsyncStorage.removeItem(USERNAME_STORAGE_KEY);
        } else {
          // ALWAYS clear any saved username and error when page loads
          // This ensures username is never prefilled and errors don't persist
          console.log('Clearing saved username and error');
          await AsyncStorage.removeItem(ERROR_STORAGE_KEY);
          await AsyncStorage.removeItem(USERNAME_STORAGE_KEY);
          setUsername(''); // Force username to be empty
          setError(''); // Clear any error message
        }
        
        // Initialize connectivity
        await checkConnectivity();
        setIsInitialized(true);
      } catch (err) {
        console.error('Error loading saved state:', err);
        setIsInitialized(true);
      }
    }
    
    loadSavedState();
    
    // Clean up on component unmount
    return () => {
      console.log('Login page unmounted');
      // Also clear on unmount to be extra safe
      AsyncStorage.removeItem(ERROR_STORAGE_KEY).catch(e => console.error(e));
      AsyncStorage.removeItem(USERNAME_STORAGE_KEY).catch(e => console.error(e));
    };
  }, []);
  
  // Function to check backend connectivity
  const checkConnectivity = async () => {
    if (!isMountedRef.current) return;
    
    try {
      setCheckingConnection(true);
      const diagnostics = await connectivityService.runConnectivityDiagnostics();
      
      if (!diagnostics.device.isConnected) {
        await setErrorSafely('No internet connection. Please check your network settings.', true);
      } else if (!diagnostics.backend.isConnected) {
        await setErrorSafely('Connection to server failed. Please try again later.', true);
      } else if (error && (error.includes('connection') || error.includes('network'))) {
        // Only clear network-related errors
        await setErrorSafely('', false);
      }
    } catch (e) {
      console.log('Error checking connectivity:', e.message);
      if (!error || error.includes('connection') || error.includes('network')) {
        await setErrorSafely('Error checking server connection', true);
      }
    } finally {
      if (isMountedRef.current) {
        setCheckingConnection(false);
      }
    }
  };

  // Button press animation - subtle effect
  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonAnim, {
        toValue: 0.97, // Reduced from 0.95 for subtler effect
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Save login info separately to prevent rerenders
  const saveLoginState = async (credentials) => {
    try {
      // Only temporarily save username during login attempt
      // Will be cleared if they leave the page
      await AsyncStorage.setItem(USERNAME_STORAGE_KEY, credentials.username);
    } catch (error) {
      console.error('Error saving login state:', error);
    }
  };

  const handleLogin = async () => {
    console.log('🔍 handleLogin function called!');
    
    if (!isMountedRef.current) {
      console.log('Component not mounted, aborting login');
      return;
    }
    
    // Track that we've attempted login to help prevent flashing
    hasAttemptedLoginRef.current = true;
    
    if (!username || !password) {
      console.log('Missing username or password');
      await setErrorSafely('Please enter both username and password', false);
      return;
    }

    try {
      setLoading(true);
      animateButtonPress();
      
      // Prepare credentials and save login state
      const credentials = { username, password };
      console.log('Credentials prepared:', { username, passwordLength: password.length });
      await saveLoginState(credentials);
      
      // Check connectivity first
      const connectivityCheck = await connectivityService.checkBackendConnectivity();
      console.log('Connectivity check result:', connectivityCheck);
      
      if (!connectivityCheck.isConnected) {
        await setErrorSafely('Connection to server failed. Please check your network and try again.', true);
        return;
      }
      
      console.log('Login process started for user:', username);
      
      // Try login without clearing error first
      try {
        console.log('Calling auth login function...');
        const user = await authLogin(credentials);
        console.log('Login successful, user data received:', user ? 'yes' : 'no');
        
        // Success - clear error and navigate
        await AsyncStorage.removeItem(ERROR_STORAGE_KEY);
        
        // CRITICAL: Force immediate navigation to profile
        console.log('CRITICAL: Forcing immediate navigation to profile page');
        
        // First attempt - direct navigation
        router.replace('/profile');
        
        // Second attempt with short delay as backup
        setTimeout(() => {
          console.log('Second navigation attempt executing...');
          try {
            router.replace('/profile');
          } catch (err) {
            console.error('Second navigation attempt failed:', err);
          }
        }, 100);
        
        // Third attempt with pathname object
        setTimeout(() => {
          console.log('Third navigation attempt executing...');
          try {
            router.replace({pathname: '/profile'});
          } catch (err) {
            console.error('Third navigation attempt failed:', err);
          }
        }, 200);
      } catch (error) {
        console.error('Login error:', error);
        
        if (error.message && 
            (error.message.includes('Network') || 
             error.message.includes('connect'))) {
          await setErrorSafely('Network error. Please check your connection and try again.', true);
        } else {
          console.log('Setting authentication error:', error.message);
          await setErrorSafely(error.message || 'Invalid username or password', false);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Helper function to navigate with flag
  const navigateWithFlag = async (path) => {
    // Clear error and username before navigating away
    await AsyncStorage.removeItem(ERROR_STORAGE_KEY);
    await AsyncStorage.removeItem(USERNAME_STORAGE_KEY);
    setError('');
    
    // Set navigation flag before navigating
    await AsyncStorage.setItem(PAGE_NAVIGATION_FLAG, 'true');
    
    // Animate out before navigation - subtle fade
    Animated.timing(fadeAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      router.push(path);
    });
  };

  // Check for password reset success in AsyncStorage
  useEffect(() => {
    async function checkPasswordResetSuccess() {
      try {
        console.log('Checking for password reset success flag in AsyncStorage');
        const resetSuccess = await AsyncStorage.getItem('password_reset_success');
        const resetTimestamp = await AsyncStorage.getItem('password_reset_timestamp');
        
        console.log('Reset success flag:', resetSuccess);
        console.log('Reset timestamp:', resetTimestamp);
        
        if (resetSuccess === 'true') {
          console.log('Found password reset success flag, showing success message');
          setSuccessMessage('Password reset successful!');
          
          // Clear the success flags
          await AsyncStorage.removeItem('password_reset_success');
          await AsyncStorage.removeItem('password_reset_timestamp');
          console.log('Cleared password reset flags from AsyncStorage');
          
          // Auto-clear success message after 5 seconds
          const timer = setTimeout(() => {
            if (isMountedRef.current) {
              setSuccessMessage('');
            }
          }, 5000);
          
          return () => clearTimeout(timer);
        }
      } catch (error) {
        console.log('Error checking password reset success:', error);
      }
    }
    
    if (isInitialized) {
      checkPasswordResetSuccess();
    }
  }, [isInitialized]);

  // If we're loading saved state or checking connection
  if (!isInitialized || checkingConnection) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {!isInitialized ? 'Initializing...' : 'Checking connection...'}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.keyboardAvoidView, { backgroundColor: colors.background }]}
    >
      <DismissKeyboardView style={[styles.container, { backgroundColor: colors.background }]}>
        <Animated.View
          style={[
            styles.loginCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: fadeAnim }],
              backgroundColor: colors.cardBg,
              shadowColor: isDarkMode ? '#000' : '#000',
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.logoContainer,
              {
                opacity: logoAnim,
                transform: [{ scale: logoAnim }]
              }
            ]}
          >
            <Logo width={200} />
          </Animated.View>
          
          <Animated.Text
            style={[
              styles.loginHeader,
              {
                opacity: logoAnim,
                color: colors.text,
                transform: [{ translateY: logoAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [5, 0]
                })}]
              }
            ]}
          >
            Login
          </Animated.Text>
          
          {/* Show success message if present */}
          {successMessage ? (
            <View style={[styles.successContainer, { 
              backgroundColor: colors.success + '20',
              borderColor: colors.success 
            }]}>
              <Text style={[styles.successText, { color: colors.success }]}>{successMessage}</Text>
            </View>
          ) : null}
          
          {/* Show error message if present */}
          <PersistentError 
            error={error}
            isNetworkError={isNetworkError}
            checkConnectivity={checkConnectivity}
          />
          
          <Animated.View 
            style={[
              styles.inputContainer,
              {
                opacity: usernameAnim,
                transform: [{ translateY: usernameAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, 0] // Reduced from 15 for subtler effect
                })}]
              }
            ]}
          >
            <Text style={[styles.label, { color: colors.text }]}>Username</Text>
            <View style={[styles.inputWrapper, { 
              backgroundColor: colors.inputBg,
              borderColor: colors.border,
            }]}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={username}
                onChangeText={text => setUsername(text)}
                placeholder="Enter your username"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoComplete="off"
                textContentType="none"
              />
            </View>
          </Animated.View>

          <Animated.View 
            style={[
              styles.inputContainer,
              {
                opacity: passwordAnim,
                transform: [{ translateY: passwordAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, 0] // Reduced from 15 for subtler effect
                })}]
              }
            ]}
          >
            <Text style={[styles.label, { color: colors.text }]}>Password</Text>
            <View style={[styles.passwordContainer, { 
              backgroundColor: colors.inputBg,
              borderColor: colors.border,
            }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput, { color: colors.text }]}
                value={password}
                onChangeText={text => setPassword(text)}
                placeholder="Enter your password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="off"
                textContentType="oneTimeCode"
                spellCheck={false}
              />
              <TouchableOpacity 
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={24} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View 
            style={{
              opacity: buttonAnim,
              transform: [
                { translateY: buttonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, 0] // Reduced from 15 for subtler effect
                })},
                { scale: buttonAnim }
              ]
            }}
          >
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                console.log('👆 Sign In button pressed!');
                handleLogin();
              }}
              disabled={loading}
              activeOpacity={0.8}
              testID="loginButton"
            >
              {loading ? (
                <ActivityIndicator color={colors.secondary} />
              ) : (
                <Text style={[styles.loginButtonText, { color: colors.secondary }]}>Login</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <Animated.View 
            style={[
              styles.orContainer,
              {
                opacity: dividerAnim,
                transform: [{ scaleX: dividerAnim }]
              }
            ]}
          >
            <View style={[styles.orLine, { backgroundColor: colors.border }]}></View>
            <Text style={[styles.orText, { color: colors.textSecondary }]}>OR</Text>
            <View style={[styles.orLine, { backgroundColor: colors.border }]}></View>
          </Animated.View>

          <Animated.View
            style={{
              opacity: createAccountAnim,
              transform: [{ translateY: createAccountAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [5, 0] // Reduced from 10 for subtler effect
              })}]
            }}
          >
            <TouchableOpacity
              style={[styles.createAccountButton, { borderColor: colors.primary }]}
              onPress={() => navigateWithFlag('/signup')}
              activeOpacity={0.8}
            >
              <Text style={[styles.createAccountText, { color: colors.primary }]}>Create Account</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={{
              opacity: forgotPasswordAnim,
              transform: [{ translateY: forgotPasswordAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [5, 0] // Reduced from 10 for subtler effect
              })}]
            }}
          >
            <TouchableOpacity
              onPress={() => navigateWithFlag('/forgot-password')}
            >
              <Text style={[styles.forgotPasswordText, { color: colors.textSecondary }]}>Forgot Password?</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </DismissKeyboardView>
    </KeyboardAvoidingView>
  );
}

// Wrapper component to ensure AuthProvider is available
export default function SafeLoginScreen() {
  const [safeToRender, setSafeToRender] = useState(false);
  const { colors } = useTheme();
  
  useEffect(() => {
    // Delay rendering to ensure any parent AuthProvider is initialized
    const timer = setTimeout(() => {
      setSafeToRender(true);
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!safeToRender) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  try {
    // Try to use the real auth context provided by parent
    return <LoginScreen />;
  } catch (e) {
    // If that fails, provide our own AuthProvider
    console.log('Falling back to local AuthProvider');
    return (
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    );
  }
}

const styles = StyleSheet.create({
  keyboardAvoidView: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  loginCard: {
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    padding: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  loginHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  inputIcon: {
    paddingLeft: 12,
    paddingRight: 4,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  passwordInput: {
    paddingRight: 40,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
  errorMargin: {
    marginBottom: 16,
  },
  loginButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    marginHorizontal: 10,
    fontSize: 14,
  },
  createAccountButton: {
    borderWidth: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  createAccountText: {
    fontSize: 16,
    fontWeight: '500',
  },
  forgotPasswordText: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    minHeight: 80, // Reserve space for errors to prevent layout shifts
    justifyContent: 'center',
    width: '100%',
  },
  successContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  successText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
}); 