import React, { useEffect } from 'react';
import { Animated, StyleSheet, View, Dimensions } from 'react-native';

/**
 * TransitionWrapper - Provides smooth transitions for screen changes and updates
 * 
 * @param {object} props Component props
 * @param {React.ReactNode} props.children Child components to wrap
 * @param {boolean} props.isVisible Whether the component is visible (default: true)
 * @param {string} props.transitionType Type of transition ('fade', 'slide', 'none') (default: 'fade')
 * @param {number} props.duration Duration of animation in milliseconds (default: 220)
 * @param {object} props.style Additional styles
 * @returns {JSX.Element} Rendered component with animation
 */
const TransitionWrapper = ({
  children,
  isVisible = true,
  transitionType = 'fade',
  duration = 220,
  style = {}
}) => {
  // Animation value - initialize to 1 to ensure content is always visible by default
  const opacityAnim = React.useRef(new Animated.Value(1)).current;
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  
  // Update animation when visibility changes
  useEffect(() => {
    if (transitionType === 'none') return;
    
    Animated.timing(opacityAnim, {
      toValue: isVisible ? 1 : 0,
      duration: duration,
      useNativeDriver: true,
    }).start();
    
    if (transitionType === 'slide') {
      Animated.timing(slideAnim, {
        toValue: isVisible ? 0 : 30,
        duration: duration,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, transitionType, duration, opacityAnim, slideAnim]);
  
  // Different animation styles based on transition type
  let animatedStyle = {};
  
  switch (transitionType) {
    case 'fade':
      animatedStyle = { opacity: opacityAnim };
      break;
    case 'slide':
      animatedStyle = {
        opacity: opacityAnim,
        transform: [{ translateY: slideAnim }],
      };
      break;
    default:
      animatedStyle = {};
  }
  
  return (
    <Animated.View style={[{ opacity: 1 }, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

// Transition with slide direction - preserves original dimensions
export const SlideTransition = ({
  children,
  isVisible = true,
  direction = 'up', // 'up', 'down', 'left', 'right'
  duration = 250,
  style = {}
}) => {
  // Initialize with values that ensure visibility by default
  const translateAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    let initialValue = 0;
    let finalValue = 0;
    
    // Set initial and final values based on direction
    // Using smaller values to maintain original dimensions
    switch (direction) {
      case 'up':
        initialValue = isVisible ? 8 : 0;
        finalValue = isVisible ? 0 : 8;
        break;
      case 'down':
        initialValue = isVisible ? -8 : 0;
        finalValue = isVisible ? 0 : -8;
        break;
      case 'left':
        initialValue = isVisible ? 8 : 0;
        finalValue = isVisible ? 0 : 8;
        break;
      case 'right':
        initialValue = isVisible ? -8 : 0;
        finalValue = isVisible ? 0 : -8;
        break;
    }
    
    translateAnim.setValue(initialValue);
    
    Animated.parallel([
      Animated.timing(translateAnim, {
        toValue: finalValue,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: isVisible ? 1 : 0,
        duration: duration,
        useNativeDriver: true,
      })
    ]).start();
  }, [isVisible, direction, duration, translateAnim, opacityAnim]);
  
  // Set transformation based on direction
  let transform = [];
  switch (direction) {
    case 'up':
    case 'down':
      transform = [{ translateY: translateAnim }];
      break;
    case 'left':
    case 'right':
      transform = [{ translateX: translateAnim }];
      break;
  }
  
  return (
    <Animated.View
      style={[
        { opacity: 1 }, // Ensure default visibility
        { opacity: opacityAnim, transform },
        style
      ]}
    >
      {children}
    </Animated.View>
  );
};

export default TransitionWrapper; 