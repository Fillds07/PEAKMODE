import React from 'react';
import { Image, StyleSheet } from 'react-native';

/**
 * Logo component that displays the PEAKMODE logo consistently across the app
 * @param {Object} props - Component props
 * @param {number} props.width - Width of the logo (optional, default: 200)
 * @param {number} props.height - Height of the logo (optional, calculated proportionally by default)
 * @param {Object} props.style - Additional style props (optional)
 * @returns {React.Component} Logo component
 */
export const Logo = ({ width = 200, height, style = {} }) => {
  // If height is not provided, calculate it proportionally
  const calculatedHeight = height || (width * 0.5);
  
  return (
    <Image
      source={require('../assets/images/fulllogo_transparent_nobuffer.png')}
      style={[
        styles.logo,
        {
          width: width,
          height: calculatedHeight,
        },
        style
      ]}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  logo: {
    alignSelf: 'center',
  },
});

export default Logo; 