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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import connectivityService from '../services/connectivity';
import { authService } from '../services/api';
import { DismissKeyboardView } from '../services/keyboardUtils';
import Logo from '../services/logoComponent';
import { Ionicons } from '@expo/vector-icons';
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

// Animation constants - subtler animations
const ANIM_DURATION = 180;
const STAGGER_DELAY = 30;

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const formItemAnims = {
    fullName: useRef(new Animated.Value(0)).current,
    email: useRef(new Animated.Value(0)).current,
    username: useRef(new Animated.Value(0)).current,
    phone: useRef(new Animated.Value(0)).current,
    password: useRef(new Animated.Value(0)).current,
    confirmPassword: useRef(new Animated.Value(0)).current,
    button: useRef(new Animated.Value(0)).current,
    divider: useRef(new Animated.Value(0)).current,
    loginButton: useRef(new Animated.Value(0)).current,
  };

  // Check connectivity when component mounts
  useEffect(() => {
    checkConnectivity();
  }, []);
  
  // Start animations when component is ready
  useEffect(() => {
    if (!isConnecting) {
      // Initial fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
      
      // Staggered animations for each element
      Animated.stagger(STAGGER_DELAY, [
        Animated.timing(logoAnim, {
          toValue: 1,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(headerAnim, {
          toValue: 1,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(formItemAnims.fullName, {
          toValue: 1,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(formItemAnims.email, {
          toValue: 1,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(formItemAnims.username, {
          toValue: 1,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(formItemAnims.phone, {
          toValue: 1,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(formItemAnims.password, {
          toValue: 1,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(formItemAnims.confirmPassword, {
          toValue: 1,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(formItemAnims.button, {
          toValue: 1,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(formItemAnims.divider, {
          toValue: 1,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(formItemAnims.loginButton, {
          toValue: 1,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isConnecting]);

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
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }
    
    // Check for common email providers
    const commonProviders = [
      'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 
      'icloud.com', 'me.com', 'aol.com', 'mail.com', 
      'protonmail.com', 'zoho.com'
    ];
    
    const domain = email.split('@')[1].toLowerCase();
    return commonProviders.includes(domain);
  };

  const validatePhone = (phone) => {
    // Basic phone validation - must be at least 10 digits
    const phoneRegex = /^\d{10,15}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const maxLength = 20;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);
    
    const isValid = 
      password.length >= minLength &&
      password.length <= maxLength &&
      hasUppercase &&
      hasLowercase &&
      hasNumber &&
      hasSpecialChar;
      
    return isValid;
  };
  
  // Button press animation - subtler
  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(formItemAnims.button, {
        toValue: 0.97,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(formItemAnims.button, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSignup = async () => {
    // Validate input
    if (!fullName || !email || !username || !password || !confirmPassword || !phone) {
      const newError = 'All fields are required';
      setError(newError);
      return;
    }

    if (!validateEmail(email)) {
      const newError = 'Please use a common email provider (gmail.com, yahoo.com, etc.)';
      setError(newError);
      return;
    }

    if (!validatePhone(phone)) {
      const newError = 'Please enter a valid phone number (10-15 digits)';
      setError(newError);
      return;
    }

    if (password !== confirmPassword) {
      const newError = 'Passwords do not match';
      setError(newError);
      return;
    }

    if (!validatePassword(password)) {
      const newError = 'Password must be 8-20 characters and include uppercase, lowercase, number, and special character';
      setError(newError);
      return;
    }

    try {
      setLoading(true);
      animateButtonPress();
      
      // If there's an error, animate its disappearance
      if (error) {
        // Let StandardError component handle the animation
        setError('');
      }
      
      // First check connectivity
      const connectivityCheck = await connectivityService.checkBackendConnectivity();
      if (!connectivityCheck.isConnected) {
        setError('Connection to server failed. Please check your network and try again.');
        setNetworkError(true);
        return;
      }
      
      // Call the signup API using authService
      try {
        console.log('Attempting to register user:', { name: fullName, email, username, phone });
        
        const userData = {
          name: fullName,
          email,
          username,
          password,
          phone
        };
        
        // Use the authService register method
        const result = await authService.register(userData);
        console.log('Registration successful:', result);
        
        // Show success alert and navigate to security questions
        Alert.alert(
          'Registration Successful',
          'Your account has been created. Please set up your security questions for password recovery.',
          [{ 
            text: 'Continue', 
            onPress: () => {
              // Clear any errors before navigating
              setError('');
              setNetworkError(false);
              
              // Animate out before navigation - subtler fade
              Animated.timing(fadeAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
              }).start(() => {
                // Navigate to security questions with username and userId as parameters
                router.replace({
                  pathname: '/security-questions',
                  params: { 
                    username: result.data.user.username,
                    userId: result.data.user.id.toString()
                  }
                });
              });
            } 
          }]
        );
      } catch (error) {
        console.error('Registration error:', error);
        
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log('Error response data:', error.response.data);
          console.log('Error response status:', error.response.status);
          
          if (error.response.data && error.response.data.message) {
            setError(error.response.data.message);
          } else {
            setError('Registration failed. Please try again.');
          }
        } else if (error.request) {
          // The request was made but no response was received
          console.log('Error request:', error.request);
          setNetworkError(true);
          setError('Network error. Please check your connection and try again.');
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log('Error message:', error.message);
          setError(error.message || 'Registration failed');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    // Animate out before navigation - subtler fade
    Animated.timing(fadeAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      router.back();
    });
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.signupCard}>
            <Animated.View 
              style={[
                styles.logoContainer,
                {
                  opacity: logoAnim,
                  transform: [{ translateY: logoAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0] // Subtler movement
                  })}]
                }
              ]}
            >
              <Logo width={220} />
            </Animated.View>
            
            <Animated.Text 
              style={[
                styles.headerText,
                {
                  opacity: headerAnim,
                  transform: [{ translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 0] // Subtler movement
                  })}]
                }
              ]}
            >
              Create Account
            </Animated.Text>
            
            <StandardError 
              message={error}
              showRetry={networkError}
              onRetry={checkConnectivity}
              style={styles.errorMargin}
            />
            
            <View style={styles.formContainer}>
              <Animated.View 
                style={[
                  styles.inputContainer,
                  {
                    opacity: formItemAnims.fullName,
                    transform: [{ translateY: formItemAnims.fullName.interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, 0] // Subtler movement
                    })}]
                  }
                ]}
              >
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    autoComplete="off"
                    textContentType="none"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
              </Animated.View>
              
              <Animated.View 
                style={[
                  styles.inputContainer,
                  {
                    opacity: formItemAnims.email,
                    transform: [{ translateY: formItemAnims.email.interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, 0] // Subtler movement
                    })}]
                  }
                ]}
              >
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="off"
                    textContentType="none"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
                <Text style={styles.hintText}>
                  Please use a common email provider (gmail.com, yahoo.com, etc.)
                </Text>
              </Animated.View>
              
              <Animated.View 
                style={[
                  styles.inputContainer,
                  {
                    opacity: formItemAnims.phone,
                    transform: [{ translateY: formItemAnims.phone.interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, 0] // Subtler movement
                    })}]
                  }
                ]}
              >
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your phone number"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    autoComplete="off"
                    textContentType="telephoneNumber"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
                <Text style={styles.hintText}>
                  Please enter a valid phone number (10-15 digits)
                </Text>
              </Animated.View>
              
              <Animated.View 
                style={[
                  styles.inputContainer,
                  {
                    opacity: formItemAnims.username,
                    transform: [{ translateY: formItemAnims.username.interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, 0] // Subtler movement
                    })}]
                  }
                ]}
              >
                <Text style={styles.label}>Username</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="at-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Choose a username"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="off"
                    textContentType="none"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
              </Animated.View>
              
              <Animated.View 
                style={[
                  styles.inputContainer,
                  {
                    opacity: formItemAnims.password,
                    transform: [{ translateY: formItemAnims.password.interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, 0] // Subtler movement
                    })}]
                  }
                ]}
              >
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Create a password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="off"
                    textContentType="oneTimeCode"
                    spellCheck={false}
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
                <Text style={styles.hintText}>
                  Password must be 8-20 characters and include uppercase, lowercase, number, and special character.
                </Text>
              </Animated.View>
              
              <Animated.View 
                style={[
                  styles.inputContainer,
                  {
                    opacity: formItemAnims.confirmPassword,
                    transform: [{ translateY: formItemAnims.confirmPassword.interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, 0] // Subtler movement
                    })}]
                  }
                ]}
              >
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="off"
                    textContentType="oneTimeCode"
                    spellCheck={false}
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
              </Animated.View>
              
              <Animated.View
                style={{
                  opacity: formItemAnims.button,
                  transform: [
                    { translateY: formItemAnims.button.interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, 0] // Subtler movement
                    })},
                    { scale: formItemAnims.button }
                  ]
                }}
              >
                <TouchableOpacity
                  style={styles.signupButton}
                  onPress={handleSignup}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.signupButtonText}>Create Account</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
              
              <Animated.View 
                style={[
                  styles.orContainer,
                  {
                    opacity: formItemAnims.divider,
                    transform: [{ scaleX: formItemAnims.divider }]
                  }
                ]}
              >
                <View style={styles.orLine}></View>
                <Text style={styles.orText}>OR</Text>
                <View style={styles.orLine}></View>
              </Animated.View>
              
              <Animated.View
                style={{
                  opacity: formItemAnims.loginButton,
                  transform: [{ translateY: formItemAnims.loginButton.interpolate({
                    inputRange: [0, 1],
                    outputRange: [5, 0] // Subtler movement
                  })}]
                }}
              >
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleGoBack}
                  activeOpacity={0.8}
                >
                  <Text style={styles.loginButtonText}>Login Instead</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </ScrollView>
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
  signupCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    overflow: 'hidden',
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
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
    color: COLORS.text,
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
  errorMargin: {
    marginBottom: 20,
  },
  signupButton: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  signupButtonText: {
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
  loginButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '500',
  }
}); 