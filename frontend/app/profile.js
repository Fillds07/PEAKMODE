import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ToastAndroid,
  FlatList,
  Pressable,
  TouchableWithoutFeedback,
  Keyboard,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { authService, userService } from '../services/api';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/authContext';
import { withAuth } from '../services/authContext';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../services/themeContext';
import ThemeToggle from '../components/ThemeToggle';

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

// Add this custom dropdown component for security questions
const CustomDropdown = ({ 
  options, 
  selectedValue, 
  onSelect, 
  placeholder = "Select a security question"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { colors } = useTheme();
  
  const selectedOption = selectedValue ? 
    options.find(option => option.id === selectedValue) : 
    null;
  
  return (
    <View style={[styles.customDropdownContainer, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
      <TouchableOpacity 
        style={[styles.customDropdownHeader, { borderColor: colors.border }]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={[
          styles.customDropdownHeaderText,
          !selectedOption && styles.customDropdownPlaceholder,
          { color: selectedOption ? colors.text : colors.textSecondary }
        ]}>
          {selectedOption ? selectedOption.question : placeholder}
        </Text>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={24} 
          color={colors.text} 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View style={[styles.customDropdownOptions, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          {options.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.customDropdownOption,
                selectedValue === option.id && [styles.customDropdownOptionSelected, { backgroundColor: colors.primary + '20' }]
              ]}
              onPress={() => {
                onSelect(option.id);
                setIsOpen(false);
              }}
            >
              <Text style={[
                styles.customDropdownOptionText,
                { color: colors.text },
                selectedValue === option.id && [styles.customDropdownOptionTextSelected, { color: colors.primary }]
              ]}>
                {option.question}
              </Text>
              {selectedValue === option.id && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

function ProfileScreen() {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');
  
  // Edit Profile Modal
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  
  // Change Password Modal
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Security Questions Modal
  const [securityQuestionsVisible, setSecurityQuestionsVisible] = useState(false);
  const [allSecurityQuestions, setAllSecurityQuestions] = useState([]);
  const [securityQuestions, setSecurityQuestions] = useState([]);
  const [securityAnswers, setSecurityAnswers] = useState({});
  const [selectedQuestions, setSelectedQuestions] = useState([
    { id: null, question: 'Select a security question', answer: '' },
    { id: null, question: 'Select a security question', answer: '' },
    { id: null, question: 'Select a security question', answer: '' }
  ]);
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [securityError, setSecurityError] = useState('');

  const { logout } = useAuth();

  // Handle refresh notifications
  const showRefreshNotification = (message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Profile', message);
    }
  };

  // Add pull-to-refresh functionality
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchUserProfile(true); // force refresh
      showRefreshNotification('Profile refreshed successfully');
    } catch (error) {
      showRefreshNotification('Failed to refresh profile');
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Immediately load profile data from SecureStore first, then refresh with API
  useEffect(() => {
    async function loadInitialData() {
      console.log("Profile page - loadInitialData started");
      try {
        // First try to load from SecureStore for instant display
        const userJson = await SecureStore.getItemAsync('peakmode_user');
        if (userJson) {
          console.log("Profile page - Found cached user data");
          const userData = JSON.parse(userJson);
          setUserData(userData);
          
          // Populate edit fields
          setEditName(userData.name || '');
          setEditEmail(userData.email || '');
          setEditUsername(userData.username || '');
          setEditPhone(userData.phone || '');
          
          // Now we can show something while we fetch the latest data
          setLoading(false);
        }
      } catch (e) {
        console.error('Error loading cached user data:', e);
      }
      
      // Check authentication status but SKIP redirection if not authenticated
      // The withAuth HOC will handle redirections
      const isAuthenticated = await authService.isAuthenticated();
      console.log("Profile page - Authentication check:", isAuthenticated);
      
      // Fetch fresh data from API regardless of auth status
      // The withAuth HOC will prevent this component from rendering if not authenticated
      fetchUserProfile();
    }
    
    loadInitialData();
    console.log("Profile page - Initial render complete");
    
    // Return cleanup function
    return () => {
      console.log("Profile page - Unmounting");
    };
  }, []);

  // Fetch user profile with better error handling and caching
  const fetchUserProfile = async (forceRefresh = false) => {
    // If we already have data and this isn't a forced refresh, just return
    if (userData && !forceRefresh) {
      setLoading(false);
      return;
    }
    
    if (!userData) {
      setLoading(true);
    }
    
    try {
      const response = await userService.getProfile();
      
      if (response?.data?.user) {
        const userData = response.data.user;
        
        // Update state with fresh data
        setUserData(userData);
        
        // Update edit form values
        setEditName(userData.name || '');
        setEditEmail(userData.email || '');
        setEditUsername(userData.username || '');
        setEditPhone(userData.phone || '');
        
        // Clear error state since we have data
        setError('');
      } else if (response?.cached) {
        // We're using cached data, show a subtle indicator
        setError('Using offline data. Pull down to refresh.');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      
      // Handle token expiration error
      if (error.response?.status === 401) {
        router.replace('/');
        return;
      }
      
      // Only display error if we couldn't get data from cache either
      if (!userData) {
        setError('Could not fetch profile data. Please try again.');
      } else {
        setError('Could not update profile. Using cached data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditProfile = () => {
    setEditError('');
    setEditProfileVisible(true);
  };

  const handleCloseEditProfile = () => {
    setEditProfileVisible(false);
  };

  // Helper function to format phone number for display
  const formatPhoneForDisplay = (phone) => {
    if (!phone) return '';
    
    // Basic formatting for US numbers, can be expanded for international
    if (phone.startsWith('+1') && phone.length === 12) {
      return `${phone.substring(0, 2)} (${phone.substring(2, 5)}) ${phone.substring(5, 8)}-${phone.substring(8)}`;
    }
    
    return phone;
  };

  // Helper for validating email
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Helper for validating phone
  const isValidPhone = (phone) => {
    if (!phone) return false; // Phone is required now
    return phone.length >= 10;
  };

  // Format date in a user-friendly way
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Optimized save profile function
  const handleSaveProfile = async () => {
    setEditLoading(true);
    setEditError('');
    
    try {
      // Validate form
      if (!editName.trim()) {
        setEditError('Name cannot be empty');
        setEditLoading(false);
        return;
      }
      
      if (!isValidEmail(editEmail)) {
        setEditError('Invalid email format');
        setEditLoading(false);
        return;
      }
      
      if (!isValidPhone(editPhone)) {
        setEditError('Invalid phone number format');
        setEditLoading(false);
        return;
      }
      
      if (!editUsername.trim()) {
        setEditError('Username cannot be empty');
        setEditLoading(false);
        return;
      }
      
      // Prepare update data
      const updateData = {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        username: editUsername.trim()
      };
      
      // Only submit data that has changed
      const changedData = Object.keys(updateData).reduce((acc, key) => {
        if (updateData[key] !== userData[key]) {
          acc[key] = updateData[key];
        }
        return acc;
      }, {});
      
      // Only make API call if something changed
      if (Object.keys(changedData).length === 0) {
        setEditProfileVisible(false);
        setEditLoading(false);
        return;
      }
      
      console.log('Saving profile changes:', changedData);
      
      const response = await userService.updateProfile(changedData);
      
      if (response?.data?.user) {
        // Update local state with fresh data
        setUserData(response.data.user);
        handleCloseEditProfile();
        
        // If username changed, we need to reload the page or re-authenticate
        if (changedData.username) {
          console.log('Username changed, will reload profile');
          // Force a small delay to let the server process the change
          setTimeout(() => {
            fetchUserProfile(true);
          }, 500);
        }
        
        // Show success message
        if (Platform.OS === 'android') {
          ToastAndroid.show('Profile updated successfully', ToastAndroid.SHORT);
        } else {
          Alert.alert('Success', 'Profile updated successfully');
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Extract error message
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to update profile';
      
      setEditError(errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  // Password change modal handling
  const handleOpenChangePassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setChangePasswordVisible(true);
  };

  const handleCloseChangePassword = () => {
    setChangePasswordVisible(false);
  };

  // Validate password strength
  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    
    // Check for at least one number
    if (!/\d/.test(password)) {
      return 'Password must contain at least one number';
    }
    
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    
    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    
    // Check for at least one special character
    if (!/[^A-Za-z0-9]/.test(password)) {
      return 'Password must contain at least one special character';
    }
    
    return ''; // Empty string means valid
  };

  // Handle password change
  const handleSavePassword = async () => {
    setPasswordLoading(true);
    setPasswordError('');
    
    try {
      // Validate current password
      if (!currentPassword) {
        setPasswordError('Current password is required');
        setPasswordLoading(false);
        return;
      }
      
      // Validate new password
      const passwordValidationError = validatePassword(newPassword);
      if (passwordValidationError) {
        setPasswordError(passwordValidationError);
        setPasswordLoading(false);
        return;
      }
      
      // Check if passwords match
      if (newPassword !== confirmPassword) {
        setPasswordError('New password and confirmation do not match');
        setPasswordLoading(false);
        return;
      }
      
      // Call API to change password
      const response = await userService.changePassword({
        currentPassword,
        newPassword
      });
      
      handleCloseChangePassword();
      
      // Show success message
      if (Platform.OS === 'android') {
        ToastAndroid.show('Password changed successfully', ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', 'Password changed successfully');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      
      // Extract error message
      const errorMessage = error.response?.data?.message || 
                           error.message || 
                           'Failed to change password';
      
      setPasswordError(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Modify logout function to use auth context
  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      // Navigation is handled by auth context
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to log out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              await userService.deleteAccount();
              
              // Navigate to login
              router.replace('/');
            } catch (error) {
              console.error('Error deleting account:', error);
              setLoading(false);
              
              Alert.alert(
                'Error',
                'Failed to delete account. Please try again.'
              );
            }
          }
        }
      ]
    );
  };

  // Get the first initial of user's name for avatar
  const getInitial = () => {
    if (!userData || !userData.name) return '?';
    return userData.name.charAt(0).toUpperCase();
  };

  // Fetch security questions for the user
  const fetchSecurityQuestions = async () => {
    try {
      setLoadingQuestions(true);
      setSecurityError('');
      
      // Get all available questions
      const allQuestionsResponse = await authService.getUserSecurityQuestions(userData.username);
      
      if (allQuestionsResponse.error) {
        setSecurityError(allQuestionsResponse.data?.message || 'Error fetching security questions');
        return;
      }
      
      console.log('Received security questions:', allQuestionsResponse.data?.data?.questions);
      
      // Make sure we're properly setting the questions from the response
      if (allQuestionsResponse.data?.data?.questions) {
        setSecurityQuestions(allQuestionsResponse.data.data.questions);
      } else {
        console.error('No questions found in response:', allQuestionsResponse);
        setSecurityError('No security questions available');
        return;
      }
      
      // Get user's selected questions if they have any
      const userQuestionsResponse = await userService.getUserSecurityQuestions();
      
      console.log('User selected questions response:', userQuestionsResponse);
      
      if (!userQuestionsResponse.error && userQuestionsResponse.data?.data?.questions) {
        // Set selected questions and their answers
        const userQuestions = userQuestionsResponse.data.data.questions;
        setSelectedQuestions(userQuestions);
        
        // Create a map of question IDs to answers
        const answers = {};
        userQuestions.forEach(q => {
          if (q.id && q.answer) {
            answers[q.id] = q.answer;
          }
        });
        
        setSecurityAnswers(answers);
      }
    } catch (error) {
      console.error('Error fetching security questions:', error);
      setSecurityError('Failed to load security questions. Please try again.');
    } finally {
      setLoadingQuestions(false);
    }
  };
  
  // Handle opening security questions modal
  const handleOpenSecurityQuestions = () => {
    fetchSecurityQuestions();
    setSecurityQuestionsVisible(true);
  };
  
  // Handle closing security questions modal
  const handleCloseSecurityQuestions = () => {
    setSecurityQuestionsVisible(false);
    setSecurityError('');
  };
  
  // Open/close dropdown
  const toggleDropdown = (index) => {
    setOpenDropdownIndex(openDropdownIndex === index ? null : index);
  };
  
  // Handle answer change
  const handleAnswerChange = (index, answer) => {
    const updatedQuestions = [...selectedQuestions];
    updatedQuestions[index].answer = answer;
    setSelectedQuestions(updatedQuestions);
  };
  
  // Handle question selection
  const handleQuestionSelect = (index, questionId) => {
    const question = securityQuestions.find(q => q.id === questionId);
    
    if (!question) return;
    
    const updatedQuestions = [...selectedQuestions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      id: question.id,
      question: question.question
    };
    
    setSelectedQuestions(updatedQuestions);
    setOpenDropdownIndex(null); // Close dropdown after selection
  };
  
  // Save security questions and answers
  const handleSaveSecurityQuestions = async () => {
    try {
      setSavingQuestions(true);
      setSecurityError('');
      
      // Validate - all questions must be selected
      const allQuestionsSelected = selectedQuestions.every(q => q.id !== null);
      
      if (!allQuestionsSelected) {
        setSecurityError('Please select all 3 security questions.');
        setSavingQuestions(false);
        return;
      }
      
      // Check if all selected questions have answers
      const allAnswersProvided = selectedQuestions.every(q => 
        q.answer && q.answer.trim().length > 0
      );
      
      if (!allAnswersProvided) {
        setSecurityError('Please provide answers for all security questions.');
        setSavingQuestions(false);
        return;
      }
      
      // Format data for API
      const answers = selectedQuestions.map(q => ({
        questionId: q.id,
        answer: q.answer
      }));
      
      // Save answers
      const response = await userService.updateSecurityQuestions({ answers });
      
      if (response.status === 'success') {
        handleCloseSecurityQuestions();
        
        // Show success message
        if (Platform.OS === 'android') {
          ToastAndroid.show('Security questions updated successfully', ToastAndroid.SHORT);
        } else {
          Alert.alert('Success', 'Security questions updated successfully');
        }
      } else {
        setSecurityError('Failed to update security questions. Please try again.');
      }
    } catch (error) {
      console.error('Error saving security questions:', error);
      setSecurityError('Failed to update security questions. Please try again.');
    } finally {
      setSavingQuestions(false);
    }
  };

  // Main render function
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {loading && !userData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading profile...</Text>
          </View>
        ) : error && !userData ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={60} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={() => fetchUserProfile(true)}
            >
              <Text style={[styles.retryButtonText, { color: colors.secondary }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Header with user avatar */}
            <View style={[styles.header, { backgroundColor: colors.cardBg }]}>
              <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
                <Text style={[styles.avatarText, { color: colors.secondary }]}>{getInitial()}</Text>
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={[styles.userName, { color: colors.text }]}>{userData?.name || 'User'}</Text>
                <Text style={[styles.userInfo, { color: colors.textSecondary }]}>@{userData?.username || 'username'}</Text>
                {error ? (
                  <Text style={[styles.cacheNotice, { color: colors.textSecondary }]}>{error}</Text>
                ) : null}
              </View>
            </View>
            
            {/* Profile details */}
            <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Details</Text>
              
              <View style={styles.profileItem}>
                <Ionicons name="mail-outline" size={20} color={colors.primary} />
                <Text style={[styles.profileLabel, { color: colors.text }]}>Email:</Text>
                <Text style={[styles.profileValue, { color: colors.textSecondary }]}>{userData?.email || 'Not set'}</Text>
              </View>
              
              <View style={styles.profileItem}>
                <Ionicons name="call-outline" size={20} color={colors.primary} />
                <Text style={[styles.profileLabel, { color: colors.text }]}>Phone:</Text>
                <Text style={[styles.profileValue, { color: colors.textSecondary }]}>
                  {userData?.phone ? formatPhoneForDisplay(userData.phone) : 'Not set'}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={[styles.editButton, { backgroundColor: colors.primary }]}
                onPress={handleOpenEditProfile}
              >
                <Ionicons name="create-outline" size={20} color={colors.secondary} />
                <Text style={[styles.editButtonText, { color: colors.secondary }]}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
            
            {/* Appearance section */}
            <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
              
              <ThemeToggle variant="switch" />
            </View>
            
            {/* Account Management section */}
            <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Management</Text>
              
              <TouchableOpacity 
                style={[styles.accountButton, { borderBottomColor: colors.border }]}
                onPress={handleOpenChangePassword}
              >
                <Ionicons name="lock-closed-outline" size={24} color={colors.text} />
                <Text style={[styles.accountButtonText, { color: colors.text }]}>Change Password</Text>
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.accountButton, { borderBottomColor: colors.border }]}
                onPress={handleOpenSecurityQuestions}
              >
                <Ionicons name="shield-checkmark-outline" size={24} color={colors.text} />
                <Text style={[styles.accountButtonText, { color: colors.text }]}>Manage Security Questions</Text>
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.accountButton, { borderBottomColor: colors.border }]}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={24} color={colors.text} />
                <Text style={[styles.accountButtonText, { color: colors.text }]}>Logout</Text>
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.accountButton, styles.deleteButton]}
                onPress={handleDeleteAccount}
              >
                <Ionicons name="trash-outline" size={24} color={colors.error} />
                <Text style={[styles.accountButtonText, styles.deleteText, { color: colors.error }]}>Delete Account</Text>
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
      
      {/* Edit Profile Modal */}
      <Modal
        visible={editProfileVisible}
        animationType="slide"
        transparent={true}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
              <TouchableOpacity onPress={handleCloseEditProfile}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {editError ? (
              <Text style={[styles.modalError, { color: colors.error, backgroundColor: colors.error + '10' }]}>{editError}</Text>
            ) : null}
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="your@email.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Phone</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Your phone number"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Username</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                value={editUsername}
                onChangeText={setEditUsername}
                placeholder="Your username"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSaveProfile}
              disabled={editLoading}
            >
              {editLoading ? (
                <ActivityIndicator size="small" color={colors.secondary} />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color={colors.secondary} />
                  <Text style={[styles.saveButtonText, { color: colors.secondary }]}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Change Password Modal */}
      <Modal
        visible={changePasswordVisible}
        animationType="slide"
        transparent={true}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Change Password</Text>
              <TouchableOpacity onPress={handleCloseChangePassword}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {passwordError ? (
              <Text style={[styles.modalError, { color: colors.error, backgroundColor: colors.error + '10' }]}>{passwordError}</Text>
            ) : null}
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Current Password</Text>
              <View style={[styles.passwordContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.passwordInput, { color: colors.text }]}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showCurrentPassword}
                />
                <TouchableOpacity 
                  style={styles.passwordToggle}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <Ionicons 
                    name={showCurrentPassword ? "eye-off-outline" : "eye-outline"} 
                    size={24} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>New Password</Text>
              <View style={[styles.passwordContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.passwordInput, { color: colors.text }]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity 
                  style={styles.passwordToggle}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons 
                    name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                    size={24} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Confirm New Password</Text>
              <View style={[styles.passwordContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.passwordInput, { color: colors.text }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity 
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                    size={24} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={[styles.passwordRequirements, { color: colors.textSecondary }]}>
              Password must contain at least 8 characters, including uppercase, lowercase, number and special character.
            </Text>
            
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSavePassword}
              disabled={passwordLoading}
            >
              {passwordLoading ? (
                <ActivityIndicator size="small" color={colors.secondary} />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color={colors.secondary} />
                  <Text style={[styles.saveButtonText, { color: colors.secondary }]}>Change Password</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Security Questions Modal */}
      <Modal
        visible={securityQuestionsVisible}
        animationType="slide"
        transparent={true}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={[styles.securityModalContent, { backgroundColor: colors.cardBg }]}>
            <TouchableWithoutFeedback onPress={() => {
              // Close any open dropdowns when tapping outside
              Keyboard.dismiss();
            }}>
              <View>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Security Questions</Text>
                  <TouchableOpacity onPress={handleCloseSecurityQuestions}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                
                {securityError ? (
                  <Text style={[styles.modalError, { color: colors.error, backgroundColor: colors.error + '10' }]}>{securityError}</Text>
                ) : null}
                
                <Text style={[styles.modalDescription, { color: colors.text }]}>
                  Select 3 security questions and provide answers. These will be used to reset your password if needed.
                </Text>
              </View>
            </TouchableWithoutFeedback>
            
            {loadingQuestions ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading security questions...</Text>
              </View>
            ) : (
              <ScrollView style={styles.questionsContainer}>
                {/* Question 1 */}
                <View style={styles.questionSection}>
                  <Text style={[styles.questionNumber, { color: colors.text }]}>Question 1</Text>
                  
                  <CustomDropdown
                    options={securityQuestions}
                    selectedValue={selectedQuestions[0]?.id}
                    onSelect={(id) => {
                      const question = securityQuestions.find(q => q.id === id);
                      if (question) {
                        const updatedQuestions = [...selectedQuestions];
                        updatedQuestions[0] = {
                          ...updatedQuestions[0],
                          id: question.id,
                          question: question.question
                        };
                        setSelectedQuestions(updatedQuestions);
                      }
                    }}
                  />
                  
                  <Text style={[styles.answerLabel, { color: colors.text }]}>Answer</Text>
                  <TextInput
                    style={[styles.answerInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                    placeholder="Your answer"
                    placeholderTextColor={colors.textSecondary}
                    value={selectedQuestions[0]?.answer || ''}
                    onChangeText={(text) => handleAnswerChange(0, text)}
                  />
                </View>
                
                <View style={[styles.questionSeparator, { backgroundColor: colors.border }]} />
                
                {/* Question 2 */}
                <View style={styles.questionSection}>
                  <Text style={[styles.questionNumber, { color: colors.text }]}>Question 2</Text>
                  
                  <CustomDropdown
                    options={securityQuestions}
                    selectedValue={selectedQuestions[1]?.id}
                    onSelect={(id) => {
                      const question = securityQuestions.find(q => q.id === id);
                      if (question) {
                        const updatedQuestions = [...selectedQuestions];
                        updatedQuestions[1] = {
                          ...updatedQuestions[1],
                          id: question.id,
                          question: question.question
                        };
                        setSelectedQuestions(updatedQuestions);
                      }
                    }}
                  />
                  
                  <Text style={[styles.answerLabel, { color: colors.text }]}>Answer</Text>
                  <TextInput
                    style={[styles.answerInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                    placeholder="Your answer"
                    placeholderTextColor={colors.textSecondary}
                    value={selectedQuestions[1]?.answer || ''}
                    onChangeText={(text) => handleAnswerChange(1, text)}
                  />
                </View>
                
                <View style={[styles.questionSeparator, { backgroundColor: colors.border }]} />
                
                {/* Question 3 */}
                <View style={styles.questionSection}>
                  <Text style={[styles.questionNumber, { color: colors.text }]}>Question 3</Text>
                  
                  <CustomDropdown
                    options={securityQuestions}
                    selectedValue={selectedQuestions[2]?.id}
                    onSelect={(id) => {
                      const question = securityQuestions.find(q => q.id === id);
                      if (question) {
                        const updatedQuestions = [...selectedQuestions];
                        updatedQuestions[2] = {
                          ...updatedQuestions[2],
                          id: question.id,
                          question: question.question
                        };
                        setSelectedQuestions(updatedQuestions);
                      }
                    }}
                  />
                  
                  <Text style={[styles.answerLabel, { color: colors.text }]}>Answer</Text>
                  <TextInput
                    style={[styles.answerInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                    placeholder="Your answer"
                    placeholderTextColor={colors.textSecondary}
                    value={selectedQuestions[2]?.answer || ''}
                    onChangeText={(text) => handleAnswerChange(2, text)}
                  />
                </View>
              </ScrollView>
            )}
            
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSaveSecurityQuestions}
              disabled={loadingQuestions || savingQuestions}
            >
              {savingQuestions ? (
                <ActivityIndicator size="small" color={colors.secondary} />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color={colors.secondary} />
                  <Text style={[styles.saveButtonText, { color: colors.secondary }]}>Save Security Questions</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// Wrap the component with the auth HOC
export default withAuth(ProfileScreen);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontWeight: 'bold',
  },
  cacheNotice: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  headerTextContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 16,
  },
  
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
    width: 80,
  },
  profileValue: {
    flex: 1,
    fontSize: 16,
  },
  
  themeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 8,
  },
  themeToggleTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeToggleText: {
    fontSize: 16,
    marginLeft: 12,
  },
  
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  editButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  accountButtonText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 16,
  },
  deleteButton: {
    borderBottomWidth: 0,
  },
  deleteText: {
    color: '#FF6B6B',
  },
  
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalError: {
    marginBottom: 16,
    padding: 8,
    borderRadius: 4,
  },
  
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  passwordToggle: {
    padding: 10,
  },
  passwordRequirements: {
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 18,
  },
  
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  saveButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  
  modalDescription: {
    fontSize: 16,
    marginBottom: 16,
  },
  
  questionsContainer: {
    maxHeight: Platform.OS === 'ios' ? '60%' : '55%',
  },
  questionSection: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  questionSeparator: {
    height: 1,
    marginVertical: 8,
  },
  questionNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 150 : 50,
  },
  answerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  answerInput: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 48,
  },
  securityModalContent: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  
  // Custom dropdown styles
  customDropdownContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  customDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  customDropdownHeaderText: {
    fontSize: 16,
    flex: 1,
  },
  customDropdownPlaceholder: {
    opacity: 0.6,
  },
  customDropdownOptions: {
    borderTopWidth: 1,
    maxHeight: 200,
  },
  customDropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 0.5,
  },
  customDropdownOptionSelected: {
  },
  customDropdownOptionText: {
    fontSize: 16,
    flex: 1,
  },
  customDropdownOptionTextSelected: {
    fontWeight: 'bold',
  },
}); 