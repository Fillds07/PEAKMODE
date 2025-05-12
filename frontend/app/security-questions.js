import React, { useState, useEffect } from 'react';
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
  Platform,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { authService } from '../services/api';
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
};

export default function SecurityQuestionsScreen() {
  const [allQuestions, setAllQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Selected questions and answers
  const [question1, setQuestion1] = useState('');
  const [question2, setQuestion2] = useState('');
  const [question3, setQuestion3] = useState('');
  const [answer1, setAnswer1] = useState('');
  const [answer2, setAnswer2] = useState('');
  const [answer3, setAnswer3] = useState('');
  
  const [username, setUsername] = useState('');
  
  // Get available security questions when component mounts
  useEffect(() => {
    fetchSecurityQuestions();
    
    // Check if we have a username from route params
    if (router.params?.username) {
      setUsername(router.params.username);
    }
  }, []);
  
  // Fetch all available security questions
  const fetchSecurityQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${authService.API_URL}/auth/security-questions`);
      const data = await response.json();
      
      if (data && data.data && Array.isArray(data.data.questions)) {
        setAllQuestions(data.data.questions);
        
        // Pre-select the first three questions
        if (data.data.questions.length >= 3) {
          setQuestion1(data.data.questions[0].id);
          setQuestion2(data.data.questions[1].id);
          setQuestion3(data.data.questions[2].id);
        }
      } else {
        setError('Failed to load security questions');
      }
    } catch (error) {
      console.error('Error fetching security questions:', error);
      setError('Failed to load security questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Save security questions and answers
  const handleSaveQuestions = async () => {
    // Validate inputs
    if (!answer1 || !answer2 || !answer3) {
      setError('Please answer all three security questions');
      return;
    }
    
    if (question1 === question2 || question1 === question3 || question2 === question3) {
      setError('Please select three different security questions');
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      
      const payload = {
        username,
        securityQuestions: [
          { questionId: question1, answer: answer1 },
          { questionId: question2, answer: answer2 },
          { questionId: question3, answer: answer3 }
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
      
      if (response.ok) {
        Alert.alert(
          'Success',
          'Your security questions have been saved. You can now log in to your account.',
          [{ 
            text: 'OK', 
            onPress: () => {
              // Clear any state and navigate to login
              router.replace('/');
            }
          }]
        );
      } else {
        setError(data.message || 'Failed to save security questions');
      }
    } catch (error) {
      console.error('Error saving security questions:', error);
      setError('Failed to save security questions. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Get question text by ID
  const getQuestionText = (id) => {
    const question = allQuestions.find(q => q.id === parseInt(id));
    return question ? question.question : 'Loading...';
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
            
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            
            <View style={styles.formContainer}>
              {/* Question 1 */}
              <View style={styles.questionContainer}>
                <Text style={styles.label}>Question 1</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={question1}
                    onValueChange={(value) => setQuestion1(value)}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                  >
                    {allQuestions.map(q => (
                      <Picker.Item key={q.id} label={q.question} value={q.id} />
                    ))}
                  </Picker>
                </View>
                
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
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={question2}
                    onValueChange={(value) => setQuestion2(value)}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                  >
                    {allQuestions.map(q => (
                      <Picker.Item key={q.id} label={q.question} value={q.id} />
                    ))}
                  </Picker>
                </View>
                
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
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={question3}
                    onValueChange={(value) => setQuestion3(value)}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                  >
                    {allQuestions.map(q => (
                      <Picker.Item key={q.id} label={q.question} value={q.id} />
                    ))}
                  </Picker>
                </View>
                
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
  pickerWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.inputBg,
    marginBottom: 15,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  pickerItem: {
    height: 50,
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
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 15,
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