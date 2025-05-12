import React, { useState, useEffect, memo } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Dropdown } from 'react-native-element-dropdown';
import { authService } from '../services/api';
import { DismissKeyboardView } from '../services/keyboardUtils';
import Logo from '../services/logoComponent';
import { Ionicons } from '@expo/vector-icons';
import { Animated } from 'react-native';
import * as SecureStore from 'expo-secure-store';

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
};

// Storage key for user data
const USER_KEY = 'peakmode_user';

// Fix React error by using memo and proper function declaration
const SimpleErrorComponent = memo(function SimpleErrorComponent(props) {
  const { message, style } = props;
  
  // If there's no message, don't render anything
  if (!message) return null;
  
  return (
    <View style={[styles.errorContainer, style]}>
      <Text style={styles.errorText}>All 3 security answers are required</Text>
    </View>
  );
});

// Export for easier imports
const SimpleError = SimpleErrorComponent;

export default function SecurityQuestionsScreen() {
  const [allQuestions, setAllQuestions] = useState([]);
  const [questionData, setQuestionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  
  // Get URL parameters
  const params = useLocalSearchParams();
  
  // Selected questions and answers
  const [question1, setQuestion1] = useState('');
  const [question2, setQuestion2] = useState('');
  const [question3, setQuestion3] = useState('');
  const [answer1, setAnswer1] = useState('');
  const [answer2, setAnswer2] = useState('');
  const [answer3, setAnswer3] = useState('');
  
  const [username, setUsername] = useState('');
  
  // Hide any bottom alert
  useEffect(() => {
    // Find and hide any alert elements
    const hideAlerts = () => {
      if (typeof document !== 'undefined') {
        const alerts = document.querySelectorAll('[role="alert"]');
        alerts.forEach(alert => {
          alert.style.display = 'none';
        });
      }
    };
    
    // Run immediately and after a delay to catch any alerts
    hideAlerts();
    const timer = setTimeout(hideAlerts, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Get available security questions and user information when component mounts
  useEffect(() => {
    const initializeData = async () => {
      await fetchSecurityQuestions();
      await getUserData();
    };
    
    initializeData();
  }, []);
  
  // Get user data from params or secure storage
  const getUserData = async () => {
    try {
      // First check URL params (from signup flow)
      if (params?.username) {
        setUsername(params.username);
        console.log('Username set from params:', params.username);
        
        // Check if we have a userId from params (this is what we need!)
        if (params?.userId) {
          setUserId(params.userId);
          console.log('UserID set from params:', params.userId);
          return;
        }
      }
      
      // If not from params, try to get from secure storage (from settings flow)
      const userJson = await SecureStore.getItemAsync(USER_KEY);
      if (userJson) {
        const userData = JSON.parse(userJson);
        if (userData.username) {
          setUsername(userData.username);
          console.log('Username set from secure storage:', userData.username);
        }
        if (userData.id) {
          setUserId(userData.id.toString());
          console.log('UserID set from secure storage:', userData.id);
        }
      } else {
        console.log('No user data found in secure storage');
      }
    } catch (error) {
      // Don't call console.error, just set the error message
      setError('Unable to retrieve user information');
    }
  };
  
  // Fetch all available security questions
  const fetchSecurityQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${authService.API_URL}/auth/security-questions`);
      const data = await response.json();
      
      if (data && data.data && Array.isArray(data.data.questions)) {
        const questions = data.data.questions;
        setAllQuestions(questions);
        
        // Format questions for Dropdown component
        const formattedQuestions = questions.map(q => ({
          value: q.id.toString(),
          label: q.question
        }));
        
        setQuestionData(formattedQuestions);
        
        // Pre-select the first three questions
        if (questions.length >= 3) {
          setQuestion1(questions[0].id.toString());
          setQuestion2(questions[1].id.toString());
          setQuestion3(questions[2].id.toString());
        }
      } else {
        // Set error for user display instead of console.error
        setError('Failed to load security questions');
      }
    } catch (error) {
      // Set error for user display instead of console.error
      setError('Failed to load security questions');
    } finally {
      setLoading(false);
    }
  };
  
  // Save security questions and answers
  const handleSaveQuestions = async () => {
    // Clear any previous errors
    setError('');
    
    // Validate inputs
    if (!answer1 || !answer2 || !answer3) {
      setError('All 3 security answers are required');
      return;
    }
    
    if (question1 === question2 || question1 === question3 || question2 === question3) {
      setError('Please select three different security questions');
      return;
    }
    
    if (!username || !userId) {
      // Use standard validation error message instead of logging to console
      setError('User information is missing');
      return;
    }
    
    try {
      setSaving(true);
      
      // Extract just the numeric part of userId and convert to Number
      const numericUserId = Number(userId.toString().replace(/\D/g, ''));
      
      // Format exactly as the server expects - be very careful about types
      const payload = {
        userId: numericUserId, // Use the numeric value
        answers: [
          { questionId: Number(question1), answer: answer1.trim() },
          { questionId: Number(question2), answer: answer2.trim() },
          { questionId: Number(question3), answer: answer3.trim() }
        ]
      };
      
      const response = await fetch(`${authService.API_URL}/auth/security-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Only navigate on success
        router.replace('/');
      } else {
        // Show error message
        setError(data.message || 'Failed to save security questions');
      }
    } catch (error) {
      // Set error message instead of logging to console
      setError('Failed to connect to server. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Render dropdown item
  const renderItem = (item) => {
    return (
      <View style={styles.dropdownItem}>
        <Text style={styles.dropdownText}>{item.label}</Text>
      </View>
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading security questions...</Text>
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
          <View style={styles.card}>
            <View style={styles.logoContainer}>
              <Logo width={220} />
            </View>
            
            <Text style={styles.headerText}>Security Questions</Text>
            <Text style={styles.subHeaderText}>
              Please select and answer three security questions. These will be used to verify your identity if you need to reset your password.
            </Text>
            
            <SimpleError 
              message={error}
              style={styles.errorMargin}
            />
            
            <View style={styles.formContainer}>
              {/* Question 1 */}
              <View style={styles.questionContainer}>
                <Text style={styles.label}>Question 1</Text>
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  data={questionData}
                  maxHeight={200}
                  labelField="label"
                  valueField="value"
                  placeholder="Select a security question"
                  value={question1}
                  onChange={item => {
                    setQuestion1(item.value);
                  }}
                  renderItem={renderItem}
                  renderRightIcon={() => (
                    <Ionicons name="chevron-down" size={20} color={COLORS.text} />
                  )}
                />
                
                <Text style={styles.label}>Answer</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={answer1}
                    onChangeText={setAnswer1}
                    placeholder="Your answer"
                    autoCapitalize="none"
                  />
                </View>
              </View>
              
              {/* Question 2 */}
              <View style={styles.questionContainer}>
                <Text style={styles.label}>Question 2</Text>
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  data={questionData}
                  maxHeight={200}
                  labelField="label"
                  valueField="value"
                  placeholder="Select a security question"
                  value={question2}
                  onChange={item => {
                    setQuestion2(item.value);
                  }}
                  renderItem={renderItem}
                  renderRightIcon={() => (
                    <Ionicons name="chevron-down" size={20} color={COLORS.text} />
                  )}
                />
                
                <Text style={styles.label}>Answer</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={answer2}
                    onChangeText={setAnswer2}
                    placeholder="Your answer"
                    autoCapitalize="none"
                  />
                </View>
              </View>
              
              {/* Question 3 */}
              <View style={styles.questionContainer}>
                <Text style={styles.label}>Question 3</Text>
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  data={questionData}
                  maxHeight={200}
                  labelField="label"
                  valueField="value"
                  placeholder="Select a security question"
                  value={question3}
                  onChange={item => {
                    setQuestion3(item.value);
                  }}
                  renderItem={renderItem}
                  renderRightIcon={() => (
                    <Ionicons name="chevron-down" size={20} color={COLORS.text} />
                  )}
                />
                
                <Text style={styles.label}>Answer</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={answer3}
                    onChangeText={setAnswer3}
                    placeholder="Your answer"
                    autoCapitalize="none"
                  />
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveQuestions}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Security Questions</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => router.replace('/')}
              >
                <Text style={styles.skipButtonText}>Skip for Now</Text>
              </TouchableOpacity>
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
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
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
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  subHeaderText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  formContainer: {
    width: '100%',
  },
  questionContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  // Styles for Dropdown component
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 16,
    marginBottom: 15,
  },
  placeholderStyle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  selectedTextStyle: {
    fontSize: 16,
    color: COLORS.text,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownText: {
    fontSize: 16,
    color: COLORS.text,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.inputBg,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
  },
  errorMargin: {
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  saveButtonText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
}); 