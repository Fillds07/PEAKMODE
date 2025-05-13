import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../services/themeContext';

/**
 * Reusable theme toggle component that can be used in different styles
 * @param {Object} props - Component props
 * @param {string} props.variant - 'icon', 'switch', or 'button'
 * @param {boolean} props.showLabel - Whether to show text label
 * @param {Object} props.style - Additional style for the container
 */
export default function ThemeToggle({ variant = 'icon', showLabel = false, style = {} }) {
  const { isDarkMode, toggleTheme, colors } = useTheme();
  
  // Icon-only toggle (used on login screen)
  if (variant === 'icon') {
    return (
      <TouchableOpacity 
        style={[styles.iconToggle, { backgroundColor: colors.inputBg }, style]}
        onPress={toggleTheme}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={isDarkMode ? "sunny-outline" : "moon-outline"} 
          size={22} 
          color={colors.textSecondary} 
        />
        {showLabel && (
          <Text style={[styles.iconLabel, { color: colors.text }]}>
            {isDarkMode ? "Dark Mode" : "Light Mode"}
          </Text>
        )}
      </TouchableOpacity>
    );
  }
  
  // Switch toggle (used on profile screen)
  if (variant === 'switch') {
    return (
      <View style={[styles.switchContainer, style]}>
        <View style={styles.switchTextContainer}>
          <Ionicons 
            name={isDarkMode ? "moon" : "sunny"} 
            size={24} 
            color={colors.primary} 
          />
          <Text style={[styles.switchText, { color: colors.text }]}>
            {isDarkMode ? "Dark Mode" : "Light Mode"}
          </Text>
        </View>
        <Switch
          trackColor={{ false: "#767577", true: colors.primary + "80" }}
          thumbColor={isDarkMode ? colors.primary : "#f4f3f4"}
          ios_backgroundColor="#767577"
          onValueChange={toggleTheme}
          value={isDarkMode}
        />
      </View>
    );
  }
  
  // Button toggle (alternative option)
  return (
    <TouchableOpacity
      style={[
        styles.buttonToggle,
        { 
          backgroundColor: colors.inputBg,
          borderColor: colors.border
        },
        style
      ]}
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={isDarkMode ? "moon" : "sunny"} 
        size={18} 
        color={colors.primary}
        style={styles.buttonIcon}
      />
      <Text style={[styles.buttonText, { color: colors.text }]}>
        {isDarkMode ? "Dark Mode" : "Light Mode"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Icon toggle styles
  iconToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    opacity: 0.9,
  },
  iconLabel: {
    fontSize: 14,
    marginLeft: 6,
  },
  
  // Switch toggle styles
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  switchTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchText: {
    fontSize: 16,
    marginLeft: 12,
  },
  
  // Button toggle styles
  buttonToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  buttonIcon: {
    marginRight: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 