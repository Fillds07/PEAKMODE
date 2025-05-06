import React from 'react';
import { useEffect, useState } from 'react';
import { 
  Keyboard, 
  Platform, 
  TouchableWithoutFeedback, 
  View, 
  StyleSheet 
} from 'react-native';

/**
 * Custom hook to track keyboard visibility
 * @returns {boolean} - Whether the keyboard is visible
 */
export const useKeyboardVisible = () => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    // For iOS devices, use keyboardWillShow and keyboardWillHide
    // For Android devices, use keyboardDidShow and keyboardDidHide
    const keyboardShowEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardHideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShowListener = Keyboard.addListener(keyboardShowEvent, () => {
      setKeyboardVisible(true);
    });
    const keyboardHideListener = Keyboard.addListener(keyboardHideEvent, () => {
      setKeyboardVisible(false);
    });

    // Clean up listeners on component unmount
    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  return isKeyboardVisible;
};

/**
 * Helper to dismiss keyboard
 */
export const dismissKeyboard = () => {
  Keyboard.dismiss();
};

/**
 * A reusable component that dismisses the keyboard when tapping outside input fields
 * @param {Object} props - Component props 
 * @param {React.ReactNode} props.children - Child components
 * @param {Object} [props.style] - Additional style for the container
 * @returns {React.ReactElement} - TouchableWithoutFeedback wrapping children
 */
export const DismissKeyboardView = ({ children, style }) => (
  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View style={[styles.container, style]}>
      {children}
    </View>
  </TouchableWithoutFeedback>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default {
  useKeyboardVisible,
  dismissKeyboard,
  DismissKeyboardView
}; 