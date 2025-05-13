import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Light mode colors
export const lightColors = {
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

// Dark mode colors
export const darkColors = {
  primary: '#F7B233', // Keep the primary color the same for brand consistency
  secondary: '#121212', // Dark background
  text: '#FFFFFF', // Light text
  textSecondary: '#BBBBBB', // Light secondary text
  background: '#121212', // Dark background
  cardBg: '#1E1E1E', // Dark card background
  inputBg: '#2D2D2D', // Dark input background
  border: '#444444', // Dark borders
  error: '#FF6B6B', // Red for errors (unchanged)
  success: '#4CAF50', // Green for success (unchanged)
};

// Create context
export const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize theme from storage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('peakmode_theme');
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Toggle theme function
  const toggleTheme = async () => {
    try {
      const newThemeValue = !isDarkMode;
      setIsDarkMode(newThemeValue);
      await AsyncStorage.setItem('peakmode_theme', newThemeValue ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Theme context value
  const theme = {
    isDarkMode,
    toggleTheme,
    colors: isDarkMode ? darkColors : lightColors,
    isLoading
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext); 