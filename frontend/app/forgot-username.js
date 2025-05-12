import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing
} from 'react-native';
import { router } from 'expo-router';
import { authService } from '../services/api';
import connectivityService from '../services/connectivity';
import { DismissKeyboardView } from '../services/keyboardUtils';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../services/logoComponent';
import StandardError from '../services/ErrorDisplay';

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

export default function ForgotUsernameScreen() {
  // State
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [username, setUsername] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Animation
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;
  
  // Check connectivity when component mounts
  useEffect(() => {
    checkConnectivity();
  }, []);
  
  // Start animations when component mounts
  useEffect(() => {
    if (!isConnecting) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        })
      ]).start();
    }
  }, [isConnecting]);
  
  // Function to check backend connectivity
  const checkConnectivity = async () => {
    try {
      console.log('Checking connectivity...');
      const connectivityStatus = await connectivityService.checkBackendConnectivity();
      console.log('Connectivity status:', connectivityStatus);
      setIsConnecting(false);
      
      if (!connectivityStatus.isConnected) {
        setError('Cannot connect to server. Please check your network connection.');
      }
    } catch (error) {
      // Don't use console.error
      console.log('Connectivity check error:', error);
      setIsConnecting(false);
      setError('Cannot connect to server. Please check your network connection.');
    }
  };
  
  // Handle username lookup
  const handleFindUsername = async () => {
    // Reset states
    setError('');
    setUsername('');
    setSuccessMessage('');
    
    // Validate email
    if (!email || !validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    try {
      console.log('Starting findUsername process with email:', email);
      setLoading(true);
      
      // Check connectivity first
      const connectivityCheck = await connectivityService.checkBackendConnectivity();
      console.log('Connectivity check result:', connectivityCheck);
      
      if (!connectivityCheck.isConnected) {
        setError('Connection to server failed. Please check your network and try again.');
        return;
      }
      
      // Log API URL
      console.log('API URL is:', authService.API_URL);
      
      // Call the find username API
      console.log('Calling findUsername API with:', JSON.stringify({ email }));
      const response = await authService.findUsername({ email });
      
      // Log full response for debugging
      console.log('Find username response:', JSON.stringify(response));
      
      // Handle error case returned in our new structured format
      if (response?.error) {
        console.log('Error response detected:', response.data.message);
        setError(response.data.message || 'No account found with this email');
        return;
      }
      
      // Check for username in the correct path based on backend response structure
      // The backend returns: { status: 'success', data: { username: '...' } }
      console.log('Checking response data path:', response?.data?.data?.username);
      if (response?.data?.data?.username) {
        console.log('Username found:', response.data.data.username);
        setUsername(response.data.data.username);
        setSuccessMessage('We found your username!');
      } else {
        console.log('No username found in response');
        setError('We could not find an account with that email address');
      }
    } catch (error) {
      // Don't use console.error, just set the error message
      console.log('Caught error in handleFindUsername:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle back button
  const handleGoBack = () => {
    router.back();
  };
  
  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Show loading indicator during initial connectivity check
  if (isConnecting) {
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
        <Animated.View 
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.logoContainer}>
            <Logo width={200} />
          </View>
          
          <Text style={styles.headerText}>Forgot Username</Text>
          <Text style={styles.subHeaderText}>
            Enter your email address and we'll help you find your username.
          </Text>
          
          <StandardError 
            message={error}
            showRetry={false}
            style={styles.errorMargin}
          />
          
          {username ? (
            <View style={styles.usernameContainer}>
              <Text style={styles.successMessage}>{successMessage}</Text>
              <View style={styles.usernameBox}>
                <Text style={styles.usernameText}>{username}</Text>
              </View>
              <Text style={styles.noteText}>
                Please write down your username and keep it in a safe place.
              </Text>
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
            </View>
          )}
          
          {!username ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleFindUsername}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Find Username</Text>
              )}
            </TouchableOpacity>
          ) : null}
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleGoBack}
          >
            <Text style={styles.secondaryButtonText}>
              {username ? 'Back to Login' : 'Back'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
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
  card: {
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
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  subHeaderText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 16,
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
  errorMargin: {
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  usernameContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: COLORS.success,
    marginBottom: 16,
    fontWeight: '500',
  },
  usernameBox: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  usernameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  noteText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
}); 