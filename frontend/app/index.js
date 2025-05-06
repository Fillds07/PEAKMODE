import React, { useState, useEffect } from 'react';
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
import { router } from 'expo-router';
import { authService } from '../services/api';
import connectivityService from '../services/connectivity';
import { DismissKeyboardView } from '../services/keyboardUtils';
import Logo from '../services/logoComponent';
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

export default function Index() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [networkError, setNetworkError] = useState(false);

  // Check connectivity when component mounts
  useEffect(() => {
    checkConnectivity();
  }, []);

  // Function to check backend connectivity
  const checkConnectivity = async () => {
    try {
      setCheckingConnection(true);
      const diagnostics = await connectivityService.runConnectivityDiagnostics();
      
      if (!diagnostics.device.isConnected) {
        setNetworkError(true);
        setError('No internet connection. Please check your network settings.');
      } else if (!diagnostics.backend.isConnected) {
        setNetworkError(true);
        setError('Connection to server failed. Please try again later.');
      } else {
        setNetworkError(false);
        setError('');
      }
    } catch (e) {
      console.log('Error checking connectivity:', e.message);
      setNetworkError(true);
      setError('Error checking server connection');
    } finally {
      setCheckingConnection(false);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // First check connectivity
      const connectivityCheck = await connectivityService.checkBackendConnectivity();
      if (!connectivityCheck.isConnected) {
        setError('Connection to server failed. Please check your network and try again.');
        setNetworkError(true);
        return;
      }
      
      // Call the login API through our service
      try {
        const user = await authService.login({
          username,
          password
        });
        
        console.log('Login successful:', user);
        
        // Navigate to profile
        router.replace('/profile');
      } catch (error) {
        console.error('Login error:', error);
        
        if (error.message && 
            (error.message.includes('Network') || 
             error.message.includes('connect'))) {
          setNetworkError(true);
          setError('Network error. Please check your connection and try again.');
        } else {
          // Show the error message from the API service 
          setError(error.message || 'Invalid username or password');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Render loading indicator during initial connectivity check
  if (checkingConnection) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Checking connection...</Text>
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
          
          {networkError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={checkConnectivity}
              >
                <Text style={styles.retryText}>Retry Connection</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
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
                onChangeText={setPassword}
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

          {error && !networkError && (
            <View style={styles.errorMessageContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

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
            onPress={() => router.push('/signup')}
          >
            <Text style={styles.createAccountText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/forgot-password')}
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
    marginBottom: 24,
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
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#F0F0F0',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  retryText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  errorMessageContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.error,
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