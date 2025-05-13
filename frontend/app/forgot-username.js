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
import { useTheme } from '../services/themeContext';
import ThemeToggle from '../components/ThemeToggle';
import { getThemedStyles } from '../services/themeHelper';

export default function ForgotUsernameScreen() {
  const { colors, isDarkMode } = useTheme();
  const themedStyles = getThemedStyles(colors);
  
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
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Checking connection...</Text>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidView}
    >
      <DismissKeyboardView style={[styles.container, { backgroundColor: colors.background }]}>
        <Animated.View 
          style={[
            styles.card,
            {
              backgroundColor: colors.cardBg,
              shadowColor: colors.text,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.logoContainer}>
            <Logo width={200} />
          </View>
          
          <Text style={[styles.headerText, { color: colors.text }]}>Forgot Username</Text>
          <Text style={[styles.subHeaderText, { color: colors.textSecondary }]}>
            Enter your email address and we'll help you find your username.
          </Text>
          
          <StandardError 
            message={error}
            showRetry={false}
            style={styles.errorMargin}
          />
          
          {username ? (
            <View style={styles.usernameContainer}>
              <Text style={[styles.successMessage, { color: colors.success }]}>{successMessage}</Text>
              <View style={[styles.usernameBox, { backgroundColor: colors.inputBg, borderColor: colors.primary }]}>
                <Text style={[styles.usernameText, { color: colors.text }]}>{username}</Text>
              </View>
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                Please write down your username and keep it in a safe place.
              </Text>
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
          )}
          
          {!username ? (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={handleFindUsername}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.secondary} />
              ) : (
                <Text style={[styles.primaryButtonText, { color: colors.secondary }]}>Find Username</Text>
              )}
            </TouchableOpacity>
          ) : null}
          
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.primary }]}
            onPress={handleGoBack}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
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
  card: {
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
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subHeaderText: {
    fontSize: 16,
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
  errorMargin: {
    marginBottom: 16,
  },
  primaryButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    borderWidth: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  usernameContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  successMessage: {
    fontSize: 16,
    marginBottom: 16,
    fontWeight: '500',
  },
  usernameBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  usernameText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  noteText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
}); 