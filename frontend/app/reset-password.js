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
import { useTheme } from '../services/themeContext';
import ThemeToggle from '../components/ThemeToggle';
import { getThemedStyles } from '../services/themeHelper';

export default function ResetPasswordScreen() {
  const { colors, isDarkMode } = useTheme();
  const themedStyles = getThemedStyles(colors);
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
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Checking connection...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
              <View style={styles.headerContainer}>
                <Logo width={250} />
                <Text style={[styles.headerText, { color: colors.primary }]}>Reset Password</Text>
              </View>
              
              {networkError && (
                <View style={[styles.errorContainer, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                  <TouchableOpacity 
                    style={[styles.retryButton, { backgroundColor: colors.cardBg }]}
                    onPress={checkConnectivity}
                  >
                    <Text style={[styles.retryText, { color: colors.primary }]}>Retry Connection</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {success ? (
                <View style={[styles.successContainer, { backgroundColor: colors.success + '20', borderColor: colors.success }]}>
                  <Text style={[styles.successText, { color: colors.success }]}>Your password has been successfully reset!</Text>
                  <Text style={[styles.successSubText, { color: colors.success }]}>Redirecting to login page...</Text>
                  <ActivityIndicator color={colors.success} style={styles.successIndicator} />
                </View>
              ) : (
                <View style={styles.formContainer}>
                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.text }]}>New Password</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={[styles.input, styles.passwordInput, { 
                          backgroundColor: colors.inputBg, 
                          borderColor: colors.border,
                          color: colors.text
                        }]}
                        placeholder="Enter your new password"
                        placeholderTextColor={colors.textSecondary}
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
                          color={colors.textSecondary} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.text }]}>Confirm New Password</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={[styles.input, styles.passwordInput, { 
                          backgroundColor: colors.inputBg, 
                          borderColor: colors.border,
                          color: colors.text
                        }]}
                        placeholder="Confirm your new password"
                        placeholderTextColor={colors.textSecondary}
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
                          color={colors.textSecondary} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {error && !networkError && (
                    <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                  )}
                  
                  <TouchableOpacity
                    style={[styles.resetButton, { backgroundColor: colors.primary }]}
                    onPress={handleResetPassword}
                    disabled={loading || !token}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.secondary} />
                    ) : (
                      <Text style={[styles.resetButtonText, { color: colors.secondary }]}>Reset Password</Text>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.cancelButton, { backgroundColor: colors.inputBg }]}
                    onPress={handleGoBack}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
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
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subHeaderText: {
    fontSize: 16,
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
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  errorContainer: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  retryText: {
    fontWeight: '500',
  },
  resetButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
  },
  successContainer: {
    padding: 25,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  successSubText: {
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
    paddingRight: 50,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    height: 50,
    justifyContent: 'center',
  },
}); 