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
import { useTheme } from '../services/themeContext';
import ThemeToggle from '../components/ThemeToggle';
import { getThemedStyles } from '../services/themeHelper';

export default function ForgotPasswordScreen() {
  const { colors, isDarkMode } = useTheme();
  const themedStyles = getThemedStyles(colors);
  
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
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
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
            
            {/* Step 1: Enter Username */}
            {currentStep === 1 && (
              <>
                <Text style={[styles.headerText, { color: colors.text }]}>Forgot Password</Text>
                <Text style={[styles.subHeaderText, { color: colors.textSecondary }]}>
                  Enter your username to begin the password reset process.
                </Text>
                
                <StandardError 
                  message={error}
                  showRetry={false}
                  style={styles.errorMargin}
                />
                
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.text }]}>Username</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Enter your username"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                </View>
                
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={handleUsernameSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.secondary} />
                  ) : (
                    <Text style={[styles.primaryButtonText, { color: colors.secondary }]}>Continue</Text>
                  )}
                </TouchableOpacity>
                
                <View style={styles.linkContainer}>
                  <TouchableOpacity
                    onPress={() => router.push('/forgot-username')}
                  >
                    <Text style={[styles.linkText, { color: colors.primary }]}>Forgot Username?</Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: colors.primary }]}
                  onPress={handleGoBack}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Back to Login</Text>
                </TouchableOpacity>
              </>
            )}
            
            {/* Step 2: Answer Security Questions */}
            {currentStep === 2 && (
              <>
                <Text style={[styles.headerText, { color: colors.text }]}>Security Questions</Text>
                <Text style={[styles.subHeaderText, { color: colors.textSecondary }]}>
                  Please answer your security questions to verify your identity.
                </Text>
                
                <StandardError 
                  message={error}
                  showRetry={false}
                  style={styles.errorMargin}
                />
                
                {securityQuestions.map((question, index) => (
                  <View key={question.id} style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.text }]}>Question {index + 1}</Text>
                    <Text style={[styles.questionText, { color: colors.text }]}>{question.question}</Text>
                    <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                      <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Your answer"
                        value={securityAnswers[question.id] || ''}
                        onChangeText={(text) => handleAnswerChange(question.id, text)}
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                  </View>
                ))}
                
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={handleSecurityAnswersSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.secondary} />
                  ) : (
                    <Text style={[styles.primaryButtonText, { color: colors.secondary }]}>Verify Answers</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: colors.primary }]}
                  onPress={handleGoBack}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Back</Text>
                </TouchableOpacity>
              </>
            )}
            
            {/* Step 3: Reset Password */}
            {currentStep === 3 && (
              <>
                <Text style={[styles.headerText, { color: colors.text }]}>Reset Password</Text>
                <Text style={[styles.subHeaderText, { color: colors.textSecondary }]}>
                  Create a new password for your account.
                </Text>
                
                {/* Display current username for debugging */}
                <Text style={[styles.subHeaderText, {fontSize: 12, color: colors.textSecondary}]}>
                  Username: {username}
                </Text>
                
                <StandardError 
                  message={error}
                  showRetry={false}
                  style={styles.errorMargin}
                />
                
                {/* Show verification success message without redirect text */}
                {successMessage && (
                  <View style={[styles.successContainer, { backgroundColor: `${colors.success}20`, borderColor: colors.success }]}>
                    <Text style={[styles.successText, { color: colors.success }]}>{successMessage}</Text>
                  </View>
                )}
                
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.text }]}>New Password</Text>
                  <View style={[styles.passwordContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.passwordInput, { color: colors.text }]}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholderTextColor={colors.textSecondary}
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
                  <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
                  <View style={[styles.passwordContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.passwordInput, { color: colors.text }]}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                </View>
                
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.secondary} />
                  ) : (
                    <Text style={[styles.primaryButtonText, { color: colors.secondary }]}>Reset Password</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: colors.primary }]}
                  onPress={handleGoBack}
                  disabled={loading}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Back</Text>
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
  questionText: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  passwordContainer: {
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
  linkContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  successContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  successText: {
    fontSize: 14,
    textAlign: 'center',
  },
  tokenContainer: {
    marginBottom: 16,
  },
  tokenExpiryText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
}); 