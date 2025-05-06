import React, { useState, useEffect, useRef } from 'react';
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
import { router } from 'expo-router';
import { authService } from '../services/api';
import connectivityService from '../services/connectivity';
import { DismissKeyboardView } from '../services/keyboardUtils';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../services/logoComponent';

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

// Token expiration time in minutes
const TOKEN_EXPIRATION_MINUTES = 10;

export default function ForgotPasswordScreen() {
  // Step 1: Request reset token with identifier (username or email)
  const [identifier, setIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState('email'); // 'email' or 'username'
  
  // Step 2: Enter token received via email
  const [resetToken, setResetToken] = useState('');
  const [tokenRequestTime, setTokenRequestTime] = useState(null);
  const [remainingTime, setRemainingTime] = useState(TOKEN_EXPIRATION_MINUTES * 60);
  const timerRef = useRef(null);
  const [resendLoading, setResendLoading] = useState(false);
  
  // Step 3: Enter new password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // General state
  const [currentStep, setCurrentStep] = useState(1); // 1, 2, or 3
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showRequestNewToken, setShowRequestNewToken] = useState(false);

  // Check connectivity when component mounts
  useEffect(() => {
    checkConnectivity();
  }, []);

  // Timer for token expiration
  useEffect(() => {
    if (currentStep === 2 && tokenRequestTime) {
      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Calculate initial remaining time
      const elapsedSeconds = Math.floor((Date.now() - tokenRequestTime) / 1000);
      const initialRemainingTime = Math.max(0, TOKEN_EXPIRATION_MINUTES * 60 - elapsedSeconds);
      setRemainingTime(initialRemainingTime);
      
      // Set up the countdown timer
      timerRef.current = setInterval(() => {
        setRemainingTime(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            clearInterval(timerRef.current);
            return 0;
          }
          return newTime;
        });
      }, 1000);
      
      // Clean up timer on unmount or when changing steps
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [currentStep, tokenRequestTime]);

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
      } else if (!diagnostics.database.isConnected) {
        setNetworkError(true);
        setError('Backend database connection issue detected.');
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

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const maxLength = 20;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);
    
    return {
      isValid: 
        password.length >= minLength &&
        password.length <= maxLength &&
        hasUppercase &&
        hasLowercase &&
        hasNumber &&
        hasSpecialChar,
      minLength: password.length >= minLength,
      maxLength: password.length <= maxLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar
    };
  };

  const handleRequestResetToken = async () => {
    // Reset messages
    setError('');
    setSuccessMessage('');
    
    // Validate input
    if (!identifier) {
      setError(`Please enter your ${identifierType}`);
      return;
    }

    // Validate email format if using email
    if (identifierType === 'email' && !validateEmail(identifier)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      
      // First check connectivity
      const connectivityCheck = await connectivityService.checkBackendConnectivity();
      if (!connectivityCheck.isConnected) {
        setError('Connection to server failed. Please check your network and try again.');
        setNetworkError(true);
        return;
      }
      
      // Call the forgot password API through our service
      try {
        // Create payload based on identifier type
        const payload = identifierType === 'email' 
          ? { email: identifier } 
          : { username: identifier };
          
        await authService.forgotPassword(payload);
        
        // Set token request time for expiration tracking
        setTokenRequestTime(Date.now());
        
        // Move to next step
        setCurrentStep(2);
        setSuccessMessage(`A reset token has been sent to the email associated with this ${identifierType}`);
      } catch (error) {
        console.error('Forgot password error:', error);
        
        if (error.message && (error.message.includes('Network') || error.message.includes('connect'))) {
          setNetworkError(true);
          setError('Network error. Please check your connection and try again.');
        } else {
          // For security reasons, we don't want to reveal if an identifier exists or not
          setTokenRequestTime(Date.now());
          setCurrentStep(2);
          setSuccessMessage(`If an account with this ${identifierType} exists, a reset token has been sent to your email`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendToken = async () => {
    // Reset messages
    setError('');
    setSuccessMessage('');
    setResendLoading(true);
    
    try {
      // First check connectivity
      const connectivityCheck = await connectivityService.checkBackendConnectivity();
      if (!connectivityCheck.isConnected) {
        setError('Connection to server failed. Please check your network and try again.');
        setNetworkError(true);
        return;
      }
      
      // Call the forgot password API through our service
      try {
        // Create payload based on identifier type
        const payload = identifierType === 'email' 
          ? { email: identifier } 
          : { username: identifier };
          
        await authService.forgotPassword(payload);
        
        // Set token request time for expiration tracking
        setTokenRequestTime(Date.now());
        
        // Reset the token field
        setResetToken('');
        
        // Reset the timer (the useEffect will handle this due to tokenRequestTime change)
        // This ensures a full 10 minutes for the new token
        
        // Update success message
        setSuccessMessage(`A new reset token has been sent to your email`);
        
        // Show brief feedback toast or alert
        Alert.alert(
          "Token Resent",
          "A new reset token has been sent to your email. Please check your inbox and spam folder."
        );
      } catch (error) {
        console.error('Resend token error:', error);
        
        if (error.message && (error.message.includes('Network') || error.message.includes('connect'))) {
          setNetworkError(true);
          setError('Network error. Please check your connection and try again.');
        } else {
          // For security reasons, we don't want to reveal if an identifier exists or not
          setTokenRequestTime(Date.now());
          setSuccessMessage(`If an account with this ${identifierType} exists, a new reset token has been sent to your email`);
          
          // Still provide feedback
          Alert.alert(
            "Token Resent",
            "If an account with this identifier exists, a new reset token has been sent to the associated email."
          );
        }
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyToken = () => {
    // Reset error message
    setError('');
    
    // Validate token
    if (!resetToken) {
      setError('Please enter the reset token received in your email');
      return;
    }
    
    if (resetToken.length < 6) {
      setError('Please enter the complete token received in your email');
      return;
    }
    
    // Move to password reset step
    setCurrentStep(3);
  };

  const handleResetPassword = async () => {
    // Reset error message
    setError('');
    
    // Validate passwords
    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm your new password');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate token
    if (!resetToken || resetToken.trim() === '') {
      setError('Invalid reset token. Please request a new one.');
      setShowRequestNewToken(true);
      return;
    }
    
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      let errorMsg = 'Password must:';
      if (!passwordValidation.minLength) errorMsg += ' be at least 8 characters long,';
      if (!passwordValidation.maxLength) errorMsg += ' be at most 20 characters long,';
      if (!passwordValidation.hasUppercase) errorMsg += ' include uppercase letters,';
      if (!passwordValidation.hasLowercase) errorMsg += ' include lowercase letters,';
      if (!passwordValidation.hasNumber) errorMsg += ' include numbers,';
      if (!passwordValidation.hasSpecialChar) errorMsg += ' include special characters,';
      
      // Replace the last comma with a period
      errorMsg = errorMsg.replace(/,$/, '.');
      
      setError(errorMsg);
      return;
    }
    
    try {
      setLoading(true);
      setSuccessMessage('');
      
      // First check connectivity
      const connectivityCheck = await connectivityService.checkBackendConnectivity();
      if (!connectivityCheck.isConnected) {
        setError('Connection to server failed. Please check your network and try again.');
        setNetworkError(true);
        return;
      }
      
      try {
        console.log('Attempting password reset with token:', resetToken.trim());
        
        // Send token verification and new password to the API
        // Make sure to trim the token to remove any whitespace
        await authService.resetPassword(resetToken.trim(), newPassword);
        
        // Show success message and redirect to login
        setSuccessMessage('Your password has been successfully reset!');
        setTimeout(() => {
          router.replace('/');
        }, 2000);
      } catch (error) {
        console.error('Password reset error:', error);
        
        if (error.message && (error.message.includes('Network') || error.message.includes('connect'))) {
          setNetworkError(true);
          setError('Network error. Please check your connection and try again.');
        } else if (error.response && error.response.status === 400) {
          // This is likely a token expiration or invalid token error
          setError('The reset token has expired or is invalid. Please request a new one.');
          setShowRequestNewToken(true);
        } else {
          setError(error.message || 'Failed to reset password. The token may have expired.');
          setShowRequestNewToken(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (currentStep === 3) {
      // From step 3 (create new password) to step 2 (enter token)
      setCurrentStep(2);
      setError('');
    } else if (currentStep === 2) {
      // From step 2 (enter token) to step 1 (request token)
      // Ask for confirmation since this will invalidate their current token entry
      if (resetToken.trim().length > 0) {
        Alert.alert(
          "Go Back?",
          "Going back will clear your entered token. Continue?",
          [
            {
              text: "Cancel",
              style: "cancel"
            },
            { 
              text: "Go Back", 
              onPress: () => {
                setCurrentStep(1);
                setResetToken('');
                setError('');
              }
            }
          ]
        );
      } else {
        // No token entered, go back without confirmation
        setCurrentStep(1);
        setError('');
      }
    } else {
      // From step 1 to login screen
      router.back();
    }
  };

  // Format remaining time as MM:SS
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Render loading indicator during initial connectivity check
  if (isConnecting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Checking connection...</Text>
      </View>
    );
  }

  const renderStepOne = () => (
    <>
      <Text style={styles.stepTitle}>Reset Password</Text>
      <Text style={styles.stepDescription}>
        Enter your email or username and we'll send you a token to reset your password.
      </Text>
      
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            identifierType === 'email' && styles.toggleButtonActive
          ]}
          onPress={() => setIdentifierType('email')}
        >
          <Text
            style={[
              styles.toggleButtonText,
              identifierType === 'email' && styles.toggleButtonTextActive
            ]}
          >
            Email
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.toggleButton,
            identifierType === 'username' && styles.toggleButtonActive
          ]}
          onPress={() => setIdentifierType('username')}
        >
          <Text
            style={[
              styles.toggleButtonText,
              identifierType === 'username' && styles.toggleButtonTextActive
            ]}
          >
            Username
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          {identifierType === 'email' ? 'Email' : 'Username'}
        </Text>
        <View style={styles.inputWrapper}>
          <Ionicons 
            name={identifierType === 'email' ? "mail-outline" : "person-outline"} 
            size={20} 
            color={COLORS.textSecondary} 
            style={styles.inputIcon} 
          />
          <TextInput
            style={styles.input}
            placeholder={identifierType === 'email' ? "Enter your email" : "Enter your username"}
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={identifierType === 'email' ? "email-address" : "default"}
            autoComplete="off"
            textContentType={identifierType === 'email' ? "emailAddress" : "username"}
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleRequestResetToken}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Send Reset Token</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleGoBack}
      >
        <Text style={styles.secondaryButtonText}>Back to Login</Text>
      </TouchableOpacity>
    </>
  );

  const renderStepTwo = () => (
    <>
      <Text style={styles.stepTitle}>Enter Reset Token</Text>
      <Text style={styles.stepDescription}>
        We've sent a token to the email associated with your account. Please enter it below.
      </Text>
      
      {successMessage && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}

      <View style={styles.timerContainer}>
        <Ionicons name="timer-outline" size={20} color={COLORS.textSecondary} />
        <Text style={styles.timerText}>
          Token expires in {formatTime(remainingTime)}
        </Text>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Reset Token</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="key-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter the 8-digit token"
            value={resetToken}
            onChangeText={setResetToken}
            autoCapitalize="none"
            keyboardType="default"
            maxLength={8}
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleVerifyToken}
        disabled={loading || resetToken.length !== 8}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Verify Token</Text>
        )}
      </TouchableOpacity>
      
      {(remainingTime <= 0 || showRequestNewToken) && (
        <TouchableOpacity
          style={styles.textButton}
          onPress={handleResendToken}
          disabled={resendLoading}
        >
          {resendLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={styles.textButtonText}>Request New Token</Text>
          )}
        </TouchableOpacity>
      )}
      
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setCurrentStep(1)}
      >
        <Text style={styles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>
    </>
  );

  const renderStepThree = () => (
    <>
      <Text style={styles.stepTitle}>Create New Password</Text>
      <Text style={styles.stepDescription}>
        Please enter and confirm your new password.
      </Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>New Password</Text>
        <View style={styles.passwordContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Enter new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNewPassword}
            autoCapitalize="none"
            textContentType="oneTimeCode"
            placeholderTextColor={COLORS.textSecondary}
          />
          <TouchableOpacity 
            style={styles.passwordToggle}
            onPress={() => setShowNewPassword(!showNewPassword)}
          >
            <Ionicons 
              name={showNewPassword ? 'eye-off' : 'eye'} 
              size={24} 
              color={COLORS.textSecondary} 
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.hintText}>
          Password must be 8-20 characters and include uppercase, lowercase, number, and special character.
        </Text>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.passwordContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            textContentType="oneTimeCode"
            placeholderTextColor={COLORS.textSecondary}
          />
          <TouchableOpacity 
            style={styles.passwordToggle}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons 
              name={showConfirmPassword ? 'eye-off' : 'eye'} 
              size={24} 
              color={COLORS.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleResetPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Reset Password</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setCurrentStep(2)}
      >
        <Text style={styles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <View style={styles.logoContainer}>
                <Logo width={220} />
              </View>
              
              {networkError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={checkConnectivity}
                  >
                    <Text style={styles.retryText}>Retry Connection</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {currentStep === 1 && renderStepOne()}
                  {currentStep === 2 && renderStepTwo()}
                  {currentStep === 3 && renderStepThree()}
                </>
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
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
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
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  toggleButtonTextActive: {
    color: COLORS.secondary,
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
  hintText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
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
  successContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  successText: {
    color: COLORS.success,
    textAlign: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  textButton: {
    padding: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  textButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
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
}); 