import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { authService } from '../services/api';
import connectivityService from '../services/connectivity';
import { DismissKeyboardView } from '../services/keyboardUtils';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../services/logoComponent';
import StandardError from '../services/ErrorDisplay';
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

export default function ForgotPasswordScreen() {
  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1); // 1: Username, 2: Security Questions, 3: Reset Password
  
  // Step 1: Username
  const [username, setUsername] = useState('');
  
  // Step 2: Security Questions
  const [securityQuestions, setSecurityQuestions] = useState([]);
  const [securityAnswers, setSecurityAnswers] = useState({});
  
  // Step 3: New Password
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // General state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  
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
  }, [isConnecting, currentStep]);
  
  // Function to check backend connectivity
  const checkConnectivity = async () => {
    try {
      const connectivityStatus = await connectivityService.checkBackendConnectivity();
      setIsConnecting(false);
      
      if (!connectivityStatus.isConnected) {
        setError('Cannot connect to server. Please check your network connection.');
      }
    } catch (error) {
      setIsConnecting(false);
      setError('Cannot connect to server. Please check your network connection.');
    }
  };
  
  // Handle username submission
  const handleUsernameSubmit = async () => {
    // Reset states
    setError('');
    setSuccessMessage('');
    
    // Validate username
    if (!username) {
      setError('Please enter your username');
      return;
    }
    
    try {
      setLoading(true);
      
      // Check connectivity first
      const connectivityCheck = await connectivityService.checkBackendConnectivity();
      if (!connectivityCheck.isConnected) {
        setError('Connection to server failed. Please check your network and try again.');
        return;
      }
      
      // Get security questions for the username
      const response = await authService.getUserSecurityQuestions(username);
      
      // Log response for debugging
      console.log('Security questions response:', JSON.stringify(response));
      
      if (response?.error) {
        setError(response.data.message || 'Username not found or no security questions set');
        return;
      }
      
      // The correct path is response.data.data.questions
      if (response?.data?.data?.questions && response.data.data.questions.length > 0) {
        setSecurityQuestions(response.data.data.questions);
        
        // Initialize security answers state
        const initialAnswers = {};
        response.data.data.questions.forEach(q => {
          initialAnswers[q.id] = '';
        });
        setSecurityAnswers(initialAnswers);
        
        // Move to security questions step
        setCurrentStep(2);
        setSuccessMessage('');
      } else {
        setError('No security questions found for this username');
      }
    } catch (error) {
      // Don't use console.error
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle security answer changes
  const handleAnswerChange = (questionId, answer) => {
    setSecurityAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };
  
  // Handle security answers submission
  const handleSecurityAnswersSubmit = async () => {
    // Reset states
    setError('');
    
    // Validate all questions are answered
    const unansweredQuestions = securityQuestions.filter(q => 
      !securityAnswers[q.id] || securityAnswers[q.id].trim() === ''
    );
    
    if (unansweredQuestions.length > 0) {
      setError('Please answer all security questions');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Verifying security answers for username:', username);
      
      // Format security answers for API
      const formattedAnswers = securityQuestions.map(q => ({
        questionId: q.id,
        answer: securityAnswers[q.id]
      }));
      
      // Verify security answers
      const response = await authService.verifySecurityAnswers({
        username,
        answers: formattedAnswers
      });
      
      // Log response for debugging
      console.log('Verify answers response:', JSON.stringify(response));
      
      if (response?.error) {
        setError(response.data.message || 'Failed to verify security answers');
        return;
      }
      
      // Store username for the final password reset step
      console.log('Username for password reset:', username);
      
      // The correct path is response.data.data.resetToken
      if (response?.data?.data?.resetToken) {
        // Store the reset token and move to reset password step
        setResetToken(response.data.data.resetToken);
        setCurrentStep(3);
        setSuccessMessage('Security answers verified');
      } else {
        setError('Failed to verify security answers');
      }
    } catch (error) {
      // Don't use console.error
      console.log('Error verifying security answers:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle password reset
  const handleResetPassword = async () => {
    // Reset error and clear any verification success message
    setError('');
    setSuccessMessage('');
    console.log('Reset Password button clicked for username:', username);
    
    // Validate passwords
    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm your new password');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      let errorMsg = 'Password must:';
      if (!passwordValidation.minLength) errorMsg += ' be at least 8 characters long,';
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
      
      console.log('Calling resetPasswordWithToken API for username:', username);
      console.log('New password length:', newPassword.length);
      
      // Reset password using username and verified security answers (no token needed)
      const response = await authService.resetPasswordWithToken(username, newPassword);
      
      // Log response for debugging
      console.log('Reset password API response:', JSON.stringify(response));
      
      if (response?.error) {
        console.log('Reset password API returned error:', response.error);
        setError(response.data.message || 'Failed to reset password');
        return;
      }
      
      // Set a new success message for the password reset itself
      setSuccessMessage('Password reset successful!');
      console.log('Password reset successful, will redirect to login page shortly...');
      
      // Store success flag in AsyncStorage and then redirect after a brief delay
      try {
        // Set a timestamp to avoid caching issues
        const timestamp = new Date().getTime();
        await AsyncStorage.setItem('password_reset_success', 'true');
        await AsyncStorage.setItem('password_reset_timestamp', timestamp.toString());
        console.log('Stored password reset success with timestamp:', timestamp);
      } catch (storageError) {
        console.log('Failed to store success flag:', storageError);
      }
      
      // Give a brief delay to show the success message before redirecting
      setTimeout(() => {
        console.log('Now redirecting to login page...');
        router.replace('/');
      }, 1500);
      
    } catch (error) {
      // Don't use console.error
      console.log('Caught error during password reset:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle back button
  const handleGoBack = () => {
    if (currentStep === 1) {
      // From username back to login
      router.back();
    } else if (currentStep === 2) {
      // From security questions back to username
      setCurrentStep(1);
      setSecurityQuestions([]);
      setSecurityAnswers({});
      setError('');
    } else if (currentStep === 3) {
      // From reset password back to security questions
      setCurrentStep(2);
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    }
  };
  
  // Validate password
  const validatePassword = (password) => {
    const validation = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[^A-Za-z0-9]/.test(password),
    };
    
    validation.isValid = (
      validation.minLength &&
      validation.hasUppercase &&
      validation.hasLowercase &&
      validation.hasNumber &&
      validation.hasSpecialChar
    );
    
    return validation;
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
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
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
            
            {/* Step 1: Enter Username */}
            {currentStep === 1 && (
              <>
                <Text style={styles.headerText}>Forgot Password</Text>
                <Text style={styles.subHeaderText}>
                  Enter your username to begin the password reset process.
                </Text>
                
                <StandardError 
                  message={error}
                  showRetry={false}
                  style={styles.errorMargin}
                />
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Username</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your username"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholderTextColor={COLORS.textSecondary}
                    />
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleUsernameSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Continue</Text>
                  )}
                </TouchableOpacity>
                
                <View style={styles.linkContainer}>
                  <TouchableOpacity
                    onPress={() => router.push('/forgot-username')}
                  >
                    <Text style={styles.linkText}>Forgot Username?</Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleGoBack}
                >
                  <Text style={styles.secondaryButtonText}>Back to Login</Text>
                </TouchableOpacity>
              </>
            )}
            
            {/* Step 2: Answer Security Questions */}
            {currentStep === 2 && (
              <>
                <Text style={styles.headerText}>Security Questions</Text>
                <Text style={styles.subHeaderText}>
                  Please answer your security questions to verify your identity.
                </Text>
                
                <StandardError 
                  message={error}
                  showRetry={false}
                  style={styles.errorMargin}
                />
                
                {securityQuestions.map((question, index) => (
                  <View key={question.id} style={styles.inputContainer}>
                    <Text style={styles.label}>Question {index + 1}</Text>
                    <Text style={styles.questionText}>{question.question}</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Your answer"
                        value={securityAnswers[question.id] || ''}
                        onChangeText={(text) => handleAnswerChange(question.id, text)}
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholderTextColor={COLORS.textSecondary}
                      />
                    </View>
                  </View>
                ))}
                
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleSecurityAnswersSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Verify Answers</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleGoBack}
                >
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </TouchableOpacity>
              </>
            )}
            
            {/* Step 3: Reset Password */}
            {currentStep === 3 && (
              <>
                <Text style={styles.headerText}>Reset Password</Text>
                <Text style={styles.subHeaderText}>
                  Create a new password for your account.
                </Text>
                
                {/* Display current username for debugging */}
                <Text style={[styles.subHeaderText, {fontSize: 12, color: '#999'}]}>
                  Username: {username}
                </Text>
                
                <StandardError 
                  message={error}
                  showRetry={false}
                  style={styles.errorMargin}
                />
                
                {/* Show verification success message without redirect text */}
                {successMessage && (
                  <View style={styles.successContainer}>
                    <Text style={styles.successText}>{successMessage}</Text>
                  </View>
                )}
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.passwordContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholderTextColor={COLORS.textSecondary}
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
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={styles.passwordContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholderTextColor={COLORS.textSecondary}
                    />
                  </View>
                </View>
                
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
                  onPress={handleGoBack}
                  disabled={loading}
                >
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </ScrollView>
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
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  questionText: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 10,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  passwordContainer: {
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
  passwordInput: {
    paddingRight: 50,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    height: 50,
    justifyContent: 'center',
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
  linkContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  successContainer: {
    backgroundColor: `${COLORS.success}20`,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  successText: {
    color: COLORS.success,
    fontSize: 14,
    textAlign: 'center',
  },
  tokenContainer: {
    marginBottom: 16,
  },
  tokenExpiryText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
}); 