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
  ToastAndroid
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { authService, userService } from '../services/api';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/authContext';
import { withAuth } from '../services/authContext';

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

function ProfileScreen() {
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
      try {
        // First try to load from SecureStore for instant display
        const userJson = await SecureStore.getItemAsync('peakmode_user');
        if (userJson) {
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
      
      // Check authentication status
      const isAuthenticated = await authService.isAuthenticated();
      if (!isAuthenticated) {
        router.replace('/');
        return;
      }
      
      // Fetch fresh data from API
      fetchUserProfile();
    }
    
    loadInitialData();
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
    if (!phone) return true; // Phone is optional
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
      
      // Prepare update data
      const updateData = {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim()
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
      
      const response = await userService.updateProfile(changedData);
      
      if (response?.data?.user) {
        // Update local state with fresh data
        setUserData(response.data.user);
        handleCloseEditProfile();
        
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

  // Add a section for security question management in the profile page
  const renderSecurityQuestionsSection = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Questions</Text>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => setSecurityQuestionsVisible(true)}
        >
          <Text style={styles.optionText}>Manage Security Questions</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    );
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

  // Main render function
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {loading && !userData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : error && !userData ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={60} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => fetchUserProfile(true)}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Header with user avatar */}
            <View style={styles.header}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{getInitial()}</Text>
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.userName}>{userData?.name || 'User'}</Text>
                <Text style={styles.userInfo}>@{userData?.username || 'username'}</Text>
                {error ? (
                  <Text style={styles.cacheNotice}>{error}</Text>
                ) : null}
              </View>
            </View>
            
            {/* Profile details */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Account Details</Text>
              
              <View style={styles.profileItem}>
                <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
                <Text style={styles.profileLabel}>Email:</Text>
                <Text style={styles.profileValue}>{userData?.email || 'Not set'}</Text>
              </View>
              
              <View style={styles.profileItem}>
                <Ionicons name="call-outline" size={20} color={COLORS.primary} />
                <Text style={styles.profileLabel}>Phone:</Text>
                <Text style={styles.profileValue}>
                  {userData?.phone ? formatPhoneForDisplay(userData.phone) : 'Not set'}
                </Text>
              </View>
              
              <View style={styles.profileItem}>
                <Ionicons name="person-outline" size={20} color={COLORS.primary} />
                <Text style={styles.profileLabel}>Role:</Text>
                <Text style={styles.profileValue}>
                  {userData?.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'User'}
                </Text>
              </View>
              
              <View style={styles.profileItem}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                <Text style={styles.profileLabel}>Joined:</Text>
                <Text style={styles.profileValue}>{userData?.createdAt ? formatDate(userData.createdAt) : 'Unknown'}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.editButton}
                onPress={handleOpenEditProfile}
              >
                <Ionicons name="create-outline" size={20} color="#FFFFFF" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
            
            {/* Account management section */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Account Management</Text>
              
              <TouchableOpacity 
                style={styles.accountButton}
                onPress={handleOpenChangePassword}
              >
                <Ionicons name="lock-closed-outline" size={24} color={COLORS.text} />
                <Text style={styles.accountButtonText}>Change Password</Text>
                <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.accountButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={24} color={COLORS.text} />
                <Text style={styles.accountButtonText}>Logout</Text>
                <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.accountButton, styles.deleteButton]}
                onPress={handleDeleteAccount}
              >
                <Ionicons name="trash-outline" size={24} color={COLORS.error} />
                <Text style={[styles.accountButtonText, styles.deleteText]}>Delete Account</Text>
                <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {renderSecurityQuestionsSection()}
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={handleCloseEditProfile}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            {editError ? (
              <Text style={styles.modalError}>{editError}</Text>
            ) : null}
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                autoCapitalize="words"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone (optional)</Text>
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Your phone number"
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={[styles.input, { backgroundColor: '#e0e0e0' }]}
                value={editUsername}
                editable={false}
              />
              <Text style={styles.helperText}>Username cannot be changed</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSaveProfile}
              disabled={editLoading}
            >
              {editLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={handleCloseChangePassword}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            {passwordError ? (
              <Text style={styles.modalError}>{passwordError}</Text>
            ) : null}
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Current Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  secureTextEntry={!showCurrentPassword}
                />
                <TouchableOpacity 
                  style={styles.passwordToggle}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <Ionicons 
                    name={showCurrentPassword ? "eye-off-outline" : "eye-outline"} 
                    size={24} 
                    color={COLORS.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity 
                  style={styles.passwordToggle}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons 
                    name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                    size={24} 
                    color={COLORS.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity 
                  style={styles.passwordToggle}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                    size={24} 
                    color={COLORS.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={styles.passwordRequirements}>
              Password must contain at least 8 characters, including uppercase, lowercase, number and special character.
            </Text>
            
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSavePassword}
              disabled={passwordLoading}
            >
              {passwordLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Change Password</Text>
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
    backgroundColor: COLORS.background,
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
    color: COLORS.textSecondary,
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
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  cacheNotice: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
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
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  headerTextContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  
  card: {
    backgroundColor: COLORS.cardBg,
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
    color: COLORS.text,
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
    color: COLORS.text,
    marginLeft: 10,
    width: 80,
  },
  profileValue: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  
  editButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  editButtonText: {
    color: COLORS.secondary,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  accountButtonText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 16,
  },
  deleteButton: {
    borderBottomWidth: 0,
  },
  deleteText: {
    color: COLORS.error,
  },
  
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
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
    color: COLORS.text,
  },
  modalError: {
    color: COLORS.error,
    marginBottom: 16,
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
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
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  passwordToggle: {
    padding: 10,
  },
  passwordRequirements: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  
  saveButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: COLORS.secondary,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
}); 