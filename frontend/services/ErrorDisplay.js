import React, { useEffect, useRef, memo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Easing } from 'react-native';

/**
 * StandardError - A consistent error display component with smooth animations
 * 
 * @param {object} props Component props
 * @param {string} props.message The error message to display
 * @param {boolean} props.showRetry Whether to show a retry button
 * @param {function} props.onRetry Callback function when retry is pressed
 * @param {object} props.style Additional styles for the container
 * @returns {JSX.Element} Rendered component
 */
const StandardError = memo(({ 
  message, 
  showRetry = false, 
  onRetry = () => {}, 
  style = {}
}) => {
  // IMPORTANT: Create refs before using them
  const prevMessageRef = useRef('');
  const messageRef = useRef(message);
  
  // Animation values - only use native driver compatible properties
  const opacity = useRef(new Animated.Value(message ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(message ? 0 : -5)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  
  // Store the current message text
  const [displayedMessage, setDisplayedMessage] = React.useState(message);
  
  useEffect(() => {
    // Skip animation if no message changes
    if (message === prevMessageRef.current) return;
    
    // If message changes from empty to something or vice versa
    if ((!prevMessageRef.current && message) || (prevMessageRef.current && !message)) {
      // Animate in or out based on message presence - with optimized timing
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: message ? 1 : 0,
          duration: 160, // Slightly faster for better perceived performance
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(translateY, {
          toValue: message ? 0 : -5,
          duration: 160,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        })
      ]).start();
      
      if (message) {
        // Set message immediately to prevent flash
        setDisplayedMessage(message);
      }
    } 
    // When error message changes but is still present - e.g., "Please enter username" -> "Incorrect password"
    else if (prevMessageRef.current && message && prevMessageRef.current !== message) {
      // Create a smooth crossfade with proper timing - optimized for 120fps perception
      Animated.timing(textOpacity, {
        toValue: 0.1, // Go more transparent for better contrast on crossfade
        duration: 80, // Faster fade out
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }).start(() => {
        // Update the message text at low opacity
        setDisplayedMessage(message);
        
        // Then fade text back in with slightly longer duration for smooth feel
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 140, // Slightly faster fade in
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }).start();
      });
    }
    
    // Update previous message reference
    prevMessageRef.current = message;
    messageRef.current = message;
  }, [message, opacity, translateY, textOpacity]);
  
  // Always render the component once it has been rendered,
  // just control visibility with opacity - prevents layout shifts
  if (!message && !prevMessageRef.current) return null;
  
  // Only use transform and opacity for native animations
  const animatedStyle = {
    opacity,
    transform: [{ translateY }]
  };
  
  return (
    <Animated.View 
      style={[
        styles.errorContainer,
        animatedStyle,
        style
      ]}
    >
      <Animated.Text style={[styles.errorText, { opacity: textOpacity }]}>
        {displayedMessage}
      </Animated.Text>
      
      {showRetry && (
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={onRetry}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo - only rerender if message or showRetry changes
  return prevProps.message === nextProps.message && 
         prevProps.showRetry === nextProps.showRetry;
});

const styles = StyleSheet.create({
  errorContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    padding: 12,
    borderRadius: 8,
    marginVertical: 0, // Reduced from 16 to avoid layout shifts
    borderWidth: 1,
    borderColor: '#FF6B6B',
    width: '100%',
    minHeight: 50, // Ensures consistent height
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    marginTop: 10,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#FF6B6B',
    fontWeight: '500',
  }
});

export default StandardError; 