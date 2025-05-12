import React, { useState, useEffect, useRef } from 'react';
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
  Platform
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { authService, AuthenticationError } from '../services/api';
import connectivityService from '../services/connectivity';
import { DismissKeyboardView } from '../services/keyboardUtils';
import Logo from '../services/logoComponent';
import { useAuth } from '../services/authContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export default function Index() {
  // State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Auth context
  const { login: authLogin } = useAuth();
  
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
          // Check for saved error message and username for failed login attempts
          const savedError = await AsyncStorage.getItem(ERROR_STORAGE_KEY);
          const savedUsername = await AsyncStorage.getItem(USERNAME_STORAGE_KEY);
          
          if (savedError) {
            console.log('Restoring saved error:', savedError);
            setError(savedError);
          }
          
          if (savedUsername) {
            console.log('Restoring saved username:', savedUsername);
            setUsername(savedUsername);
          }
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
    };
  }, []);
  
  // Function to check backend connectivity
  const checkConnectivity = async () => {
    try {
      setCheckingConnection(true);
      const diagnostics = await connectivityService.runConnectivityDiagnostics();
      
      if (!diagnostics.device.isConnected) {
        const newError = 'No internet connection. Please check your network settings.';
        setError(newError);
        // Save the error
        await AsyncStorage.setItem(ERROR_STORAGE_KEY, newError);
      } else if (!diagnostics.backend.isConnected) {
        const newError = 'Connection to server failed. Please try again later.';
        setError(newError);
        // Save the error
        await AsyncStorage.setItem(ERROR_STORAGE_KEY, newError);
      } else if (error && (error.includes('connection') || error.includes('network'))) {
        // Only clear network-related errors
        setError('');
        await AsyncStorage.removeItem(ERROR_STORAGE_KEY);
      }
    } catch (e) {
      console.log('Error checking connectivity:', e.message);
      // Don't overwrite auth errors with connectivity errors
      if (!error || error.includes('connection') || error.includes('network')) {
        const newError = 'Error checking server connection';
        setError(newError);
        await AsyncStorage.setItem(ERROR_STORAGE_KEY, newError);
      }
    } finally {
      setCheckingConnection(false);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      const newError = 'Please enter both username and password';
      setError(newError);
      await AsyncStorage.setItem(ERROR_STORAGE_KEY, newError);
      return;
    }

    try {
      setLoading(true);
      // Clear previous errors when attempting a new login
      setError('');
      await AsyncStorage.removeItem(ERROR_STORAGE_KEY);
      
      // Save username in case login fails
      await AsyncStorage.setItem(USERNAME_STORAGE_KEY, username);
      
      // First check connectivity
      const connectivityCheck = await connectivityService.checkBackendConnectivity();
      if (!connectivityCheck.isConnected) {
        const newError = 'Connection to server failed. Please check your network and try again.';
        setError(newError);
        await AsyncStorage.setItem(ERROR_STORAGE_KEY, newError);
        return;
      }
      
      // Call the login method from auth context
      try {
        await authLogin({
          username,
          password
        });
        
        // On success, clear any saved error
        await AsyncStorage.removeItem(ERROR_STORAGE_KEY);
        
        // Navigation is handled in the auth context after successful login
      } catch (error) {
        console.error('Login error:', error);
        
        let newError = '';
        
        // Handle network errors
        if (error.message && 
            (error.message.includes('Network') || 
             error.message.includes('connect'))) {
          newError = 'Network error. Please check your connection and try again.';
        } else {
          // Set the authentication error message
          console.log('Setting authentication error:', error.message);
          newError = error.message || 'Invalid username or password';
        }
        
        // Update state and save error for persistence
        setError(newError);
        await AsyncStorage.setItem(ERROR_STORAGE_KEY, newError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to navigate with flag
  const navigateWithFlag = async (path) => {
    // Set navigation flag before navigating
    await AsyncStorage.setItem(PAGE_NAVIGATION_FLAG, 'true');
    router.push(path);
  };

  // If we're loading saved state or checking connection
  if (!isInitialized || checkingConnection) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>
          {!isInitialized ? 'Initializing...' : 'Checking connection...'}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidView}
    >
      <DismissKeyboardView style={styles.container}>
        <View style={styles.loginCard}>
          <View style={styles.logoContainer}>
            <Logo width={220} />
          </View>
          
          <Text style={styles.loginHeader}>Login</Text>
          
          {/* Error message display */}
          {error ? (
            <View style={styles.errorContainer}>
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={20} color={COLORS.error} style={styles.errorIcon} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
              {error && (error.includes('connection') || error.includes('network')) && (
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={checkConnectivity}
                >
                  <Text style={styles.retryButtonText}>Retry Connection</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={text => setUsername(text)}
                placeholder="Enter your username"
                autoCapitalize="none"
                autoComplete="off"
                textContentType="none"
                placeholderTextColor={COLORS.textSecondary}
                color={COLORS.text}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={text => setPassword(text)}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="off"
                textContentType="oneTimeCode"
                spellCheck={false}
                placeholderTextColor={COLORS.textSecondary}
                color={COLORS.text}
              />
              <TouchableOpacity 
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? 'eye-off' : 'eye'} 
                  size={24} 
                  color={COLORS.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.orContainer}>
            <View style={styles.orLine}></View>
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine}></View>
          </View>

          <TouchableOpacity
            style={styles.createAccountButton}
            onPress={() => navigateWithFlag('/signup')}
          >
            <Text style={styles.createAccountText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigateWithFlag('/forgot-password')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      </DismissKeyboardView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidView: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  loginCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    padding: 24,
    shadowColor: '#000',
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
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    color: COLORS.text,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  passwordInput: {
    paddingRight: 40,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: COLORS.error,
    width: '100%',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: {
    marginRight: 6,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.error,
    marginTop: 10,
  },
  retryButtonText: {
    color: COLORS.error,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  loginButtonText: {
    color: COLORS.secondary,
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
    backgroundColor: COLORS.border,
  },
  orText: {
    color: COLORS.textSecondary,
    marginHorizontal: 10,
    fontSize: 14,
  },
  createAccountButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  createAccountText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  forgotPasswordText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
}); 