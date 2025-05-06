import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { authService } from '../services/api';
import connectivityService from '../services/connectivity';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../services/logoComponent';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [success, setSuccess] = useState(false);

  // Check connectivity and token when component mounts
  useEffect(() => {
    checkConnectivity();
    
    // Verify that we have a token
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.');
    }
  }, [token]);

  // Function to check backend connectivity
  const checkConnectivity = async () => {
    try {
      setIsConnecting(true);
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
      setIsConnecting(false);
    }
  };

  const handleResetPassword = async () => {
    // Validate input
    if (!password || !confirmPassword) {
      setError('Please enter and confirm your new password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    // Validate token
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.');
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
      
      // Call the reset password API
      try {
        await authService.resetPassword(token, password);
        
        // Show success message and redirect to login
        setSuccess(true);
        setTimeout(() => {
          router.replace('/');
        }, 3000);
      } catch (error) {
        console.error('Password reset error:', error);
        
        if (error.message.includes('Network') || error.message.includes('connect')) {
          setNetworkError(true);
          setError('Network error. Please check your connection and try again.');
        } else if (error.message.includes('expired') || error.message.includes('invalid')) {
          setError('This reset link has expired or is invalid. Please request a new password reset.');
        } else {
          setError(error.message || 'Failed to reset password');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.replace('/');
  };

  // Render loading indicator during initial connectivity check
  if (isConnecting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Checking connection...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
              <View style={styles.headerContainer}>
                <Logo width={250} />
                <Text style={styles.headerText}>Reset Password</Text>
              </View>
              
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
              
              {success ? (
                <View style={styles.successContainer}>
                  <Text style={styles.successText}>Your password has been successfully reset!</Text>
                  <Text style={styles.successSubText}>Redirecting to login page...</Text>
                  <ActivityIndicator color="#4caf50" style={styles.successIndicator} />
                </View>
              ) : (
                <View style={styles.formContainer}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>New Password</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={[styles.input, styles.passwordInput]}
                        placeholder="Enter your new password"
                        value={password}
                        onChangeText={setPassword}
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
                          name={showPassword ? 'eye-off' : 'eye'} 
                          size={24} 
                          color="#666" 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Confirm New Password</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={[styles.input, styles.passwordInput]}
                        placeholder="Confirm your new password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        autoComplete="off"
                        textContentType="oneTimeCode"
                        spellCheck={false}
                      />
                      <TouchableOpacity 
                        style={styles.passwordToggle}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <Ionicons 
                          name={showConfirmPassword ? 'eye-off' : 'eye'} 
                          size={24} 
                          color="#666" 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {error && !networkError && (
                    <Text style={styles.errorText}>{error}</Text>
                  )}
                  
                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={handleResetPassword}
                    disabled={loading || !token}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.resetButtonText}>Reset Password</Text>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleGoBack}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 10,
  },
  subHeaderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  retryText: {
    color: '#0066cc',
    fontWeight: '500',
  },
  resetButton: {
    backgroundColor: '#0066cc',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  successContainer: {
    padding: 25,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  successText: {
    color: '#2e7d32',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  successSubText: {
    color: '#388e3c',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  successIndicator: {
    marginTop: 10,
  },
  passwordContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    color: '#000000',
    paddingRight: 50,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    height: 50,
    justifyContent: 'center',
  },
}); 