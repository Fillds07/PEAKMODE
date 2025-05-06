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

export default function Profile() {
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
      await fetchUserProfile();
      showRefreshNotification('Profile refreshed successfully');
    } catch (error) {
      showRefreshNotification('Failed to refresh profile');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Check if user is authenticated
    checkAuth();
    // Get user profile once on initial load
    fetchUserProfile();
    
    // Remove the interval-based refresh
    
  }, []);

  const checkAuth = async () => {
    const isAuthenticated = await authService.isAuthenticated();
    if (!isAuthenticated) {
      router.replace('/');
    }
  };

  // Synchronize user data in memory and storage
  const syncUserData = async (userData) => {
    if (!userData) return false;
    
    try {
      setUserData(userData);
      await SecureStore.setItemAsync('peakmode_user', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Error syncing user data:', error);
      return false;
    }
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      // Try to get profile from API
      const response = await userService.getProfile();
      if (response?.data?.user) {
        const userData = response.data.user;
        await syncUserData(userData);
        
        // Also set the edit form values
        setEditName(userData.name || '');
        setEditEmail(userData.email || '');
        setEditUsername(userData.username || '');
        setEditPhone(userData.phone || '');
        
        setError('');
      } else {
        throw new Error('Invalid user data received from API');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      
      // If API call fails, try to get user data from SecureStore
      try {
        const userJson = await SecureStore.getItemAsync('peakmode_user');
        if (userJson) {
          const userData = JSON.parse(userJson);
          setUserData(userData);
          
          // Also set the edit form values
          setEditName(userData.name || '');
          setEditEmail(userData.email || '');
          setEditUsername(userData.username || '');
          setEditPhone(userData.phone || '');
          
          setError('Using cached profile data. Pull down to refresh.');
        } else {
          setError('Could not fetch profile data. Please login again.');
        }
      } catch (storageError) {
        console.error('Error fetching user from storage:', storageError);
        setError('Could not fetch profile data. Please login again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditProfile = () => {
    // Set the form values from user data
    setEditName(userData?.name || '');
    setEditEmail(userData?.email || '');
    setEditUsername(userData?.username || '');
    setEditPhone(userData?.phone || '');
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
    
    // Basic validation - can be enhanced
    return phone.length >= 10;
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  // Enhanced validation for the update profile function
  const handleSaveProfile = async () => {
    // Clear previous errors
    setEditError('');
    
    // Validate fields
    if (editEmail && !isValidEmail(editEmail)) {
      setEditError('Please enter a valid email address');
      return;
    }
    
    if (editPhone && !isValidPhone(editPhone)) {
      setEditError('Please enter a valid phone number');
      return;
    }
    
    try {
      setEditLoading(true);
      
      // Only include fields that have values and have changed
      const profileData = {};
      
      if (editName !== userData?.name) profileData.name = editName;
      if (editEmail !== userData?.email) profileData.email = editEmail;
      if (editUsername !== userData?.username) profileData.username = editUsername;
      if (editPhone !== userData?.phone) profileData.phone = editPhone || undefined;
      
      // Only make API call if there are changes
      if (Object.keys(profileData).length === 0) {
        setEditProfileVisible(false);
        Alert.alert('Info', 'No changes were made to your profile.');
        return;
      }
      
      // Call API to update profile
      const result = await userService.updateProfile(profileData);
      
      // Update local user data using sync utility
      await syncUserData(result.data.user);
      
      // Close modal and show success
      setEditProfileVisible(false);
      
      // Show which fields were updated
      const updatedFields = Object.keys(profileData).map(key => 
        key.charAt(0).toUpperCase() + key.slice(1)
      ).join(', ');
      
      Alert.alert(
        'Success', 
        `Profile updated successfully.\nUpdated fields: ${updatedFields}`
      );
      
      // Refresh user profile after update
      await fetchUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      setEditError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

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
      
    if (!isValid) {
      let errorMsg = 'Password must:';
      if (password.length < minLength) errorMsg += ' be at least 8 characters long,';
      if (password.length > maxLength) errorMsg += ' be at most 20 characters long,';
      if (!hasUppercase) errorMsg += ' include uppercase letters,';
      if (!hasLowercase) errorMsg += ' include lowercase letters,';
      if (!hasNumber) errorMsg += ' include numbers,';
      if (!hasSpecialChar) errorMsg += ' include special characters,';
      
      // Replace the last comma with a period
      errorMsg = errorMsg.replace(/,$/, '.');
      return { isValid, errorMsg };
    }
    
    return { isValid, errorMsg: '' };
  };

  const handleSavePassword = async () => {
    // Validate form
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    
    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    // Validate new password strength
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setPasswordError(validation.errorMsg);
      return;
    }
    
    try {
      setPasswordLoading(true);
      setPasswordError('');
      
      // Call API to change password
      await userService.changePassword({
        currentPassword,
        newPassword
      });
      
      // Close modal and show success
      setChangePasswordVisible(false);
      Alert.alert('Success', 'Password changed successfully');
      
      // Refresh user profile after password change
      await fetchUserProfile();
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError(error.message || 'Failed to change password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Logout', 
            style: 'destructive',
            onPress: async () => {
              setLoading(true);
              await authService.logout();
              router.replace('/');
            } 
          },
        ]
      );
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      Alert.alert(
        'Delete Account',
        'Are you sure you want to delete your account? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete Account', 
            style: 'destructive',
            onPress: async () => {
              try {
                setLoading(true);
                await userService.deleteAccount();
                Alert.alert(
                  'Account Deleted',
                  'Your account has been successfully deleted.',
                  [
                    { 
                      text: 'OK',
                      onPress: () => router.replace('/')
                    }
                  ]
                );
              } catch (error) {
                console.error('Delete account error:', error);
                setLoading(false);
                Alert.alert(
                  'Error',
                  error.message || 'Failed to delete account. Please try again.'
                );
              }
            } 
          },
        ]
      );
    } catch (error) {
      console.error('Delete account error:', error);
      Alert.alert('Error', 'Failed to process your request. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeAreaContainer}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get initial for avatar
  const getInitial = () => {
    if (!userData || !userData.name) return '?';
    return userData.name.charAt(0).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]} // Android
            tintColor={COLORS.primary} // iOS
          />
        }
      >
        <View style={styles.profileCard}>
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitial()}</Text>
              </View>
            </View>
            
            <Text style={styles.userName}>{userData?.name || 'User'}</Text>
            <Text style={styles.userHandle}>@{userData?.username || 'username'}</Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            
            <View style={styles.infoItem}>
              <Ionicons name="mail-outline" size={22} color={COLORS.primary} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{userData?.email || 'No email provided'}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="call-outline" size={22} color={COLORS.primary} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>
                  {userData?.phone ? formatPhoneForDisplay(userData.phone) : 'No phone provided'}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={22} color={COLORS.primary} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Joined</Text>
                <Text style={styles.infoValue}>{formatDate(userData?.createdAt)}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.actionsSection}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleOpenEditProfile}
            >
              <Ionicons name="person-circle-outline" size={22} color={COLORS.primary} />
              <Text style={styles.actionText}>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleOpenChangePassword}
            >
              <Ionicons name="key-outline" size={22} color={COLORS.primary} />
              <Text style={styles.actionText}>Change Password</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={22} color={COLORS.primary} />
              <Text style={styles.actionText}>Log Out</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.dangerButton]}
              onPress={handleDeleteAccount}
            >
              <Ionicons name="trash-outline" size={22} color={COLORS.error} />
              <Text style={styles.dangerText}>Delete Account</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Edit Profile Modal */}
        <Modal
          visible={editProfileVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCloseEditProfile}
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
              
              <ScrollView style={styles.modalForm}>
                <Text style={styles.modalDescription}>
                  Update your profile information. Only modified fields will be updated.
                </Text>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Full Name <Text style={styles.requiredStar}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter your full name"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Email <Text style={styles.requiredStar}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    value={editEmail}
                    onChangeText={setEditEmail}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Username <Text style={styles.requiredStar}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    value={editUsername}
                    onChangeText={setEditUsername}
                    placeholder="Enter your username"
                    autoCapitalize="none"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Phone (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
                
                {editError ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{editError}</Text>
                  </View>
                ) : null}
                
                <View style={styles.formActions}>
                  <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleCloseEditProfile}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.button, styles.saveButton]}
                    onPress={handleSaveProfile}
                    disabled={editLoading}
                  >
                    {editLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Change Password Modal */}
        <Modal
          visible={changePasswordVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCloseChangePassword}
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
              
              <ScrollView style={styles.modalForm}>
                <Text style={styles.modalDescription}>
                  Update your password. Make sure to use a strong password that you don't use elsewhere.
                </Text>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Current Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholder="Enter your current password"
                      secureTextEntry={!showCurrentPassword}
                      placeholderTextColor={COLORS.textSecondary}
                    />
                    <TouchableOpacity 
                      style={styles.passwordToggle}
                      onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      <Ionicons 
                        name={showCurrentPassword ? 'eye-off' : 'eye'} 
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
                      style={[styles.input, styles.passwordInput]}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Enter new password"
                      secureTextEntry={!showNewPassword}
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
                  <Text style={styles.passwordHint}>
                    Password must be 8-20 characters and include uppercase, lowercase, number, and special character.
                  </Text>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Confirm New Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm new password"
                      secureTextEntry={!showConfirmPassword}
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
                
                {passwordError ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{passwordError}</Text>
                  </View>
                ) : null}
                
                <View style={styles.formActions}>
                  <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleCloseChangePassword}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.button, styles.saveButton]}
                    onPress={handleSavePassword}
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.saveButtonText}>Update Password</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingVertical: 30,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 5,
  },
  userHandle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  infoSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoIcon: {
    marginRight: 12,
    width: 22,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  actionsSection: {
    padding: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  dangerButton: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  dangerText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.error,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  modalForm: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: COLORS.text,
  },
  input: {
    height: 50,
    borderWidth: 1, 
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: COLORS.inputBg,
    color: COLORS.text,
  },
  requiredStar: {
    color: COLORS.error,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 13,
  },
  passwordHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 5,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    marginRight: 10,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    marginLeft: 10,
  },
  saveButtonText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 