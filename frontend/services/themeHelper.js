import { Platform } from 'react-native';
import { lightColors, darkColors } from './themeContext';

/**
 * Helper utility to make it easier to apply consistent theme styles across the app
 */

/**
 * Applies theme colors to a base style object
 * @param {Object} baseStyle - The base style object
 * @param {Object} colors - The theme colors object
 * @param {String} variant - Optional variant name (e.g., 'card', 'input', etc.)
 * @returns {Object} - Style object with theme colors applied
 */
export const applyThemeToStyle = (baseStyle, colors, variant = '') => {
  const style = { ...baseStyle };
  
  // Common style properties that should be themed
  if (style.backgroundColor === undefined) {
    if (variant === 'card') {
      style.backgroundColor = colors.cardBg;
    } else if (variant === 'input') {
      style.backgroundColor = colors.inputBg;
    } else {
      style.backgroundColor = colors.background;
    }
  }
  
  if (style.color === undefined) {
    style.color = colors.text;
  }
  
  if (style.borderColor === undefined && style.borderWidth !== undefined) {
    style.borderColor = colors.border;
  }
  
  // Special handling for shadows
  if (style.shadowColor === undefined && 
      (style.shadowOpacity !== undefined || style.elevation !== undefined)) {
    style.shadowColor = colors.text;
  }
  
  return style;
};

/**
 * Get themed styles for common components
 * @param {Object} colors - The theme colors object
 * @returns {Object} - Object with common styled components
 */
export const getThemedStyles = (colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    color: colors.text,
  },
  textSecondary: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.inputBg,
  },
});

/**
 * Get chart config for charts using react-native-chart-kit
 * @param {Object} colors - The theme colors object
 * @param {Object} options - Optional chart configuration overrides
 * @returns {Object} - Chart configuration object
 */
export const getChartConfig = (colors, options = {}) => ({
  backgroundColor: colors.cardBg,
  backgroundGradientFrom: colors.cardBg,
  backgroundGradientTo: colors.cardBg,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(247, 178, 51, ${opacity})`,
  labelColor: (opacity = 1) => colors.text,
  propsForDots: {
    r: "5",
    strokeWidth: "2",
    stroke: colors.primary
  },
  ...options,
});

/**
 * Convenience helper to apply text styles
 * @param {Object} colors - The theme colors object 
 * @param {String} variant - Text variant (regular, bold, secondary, etc.)
 * @returns {Object} - Style object for text
 */
export const getTextStyle = (colors, variant = 'regular') => {
  const baseStyle = { color: colors.text };
  
  switch (variant) {
    case 'bold':
      return { ...baseStyle, fontWeight: 'bold' };
    case 'semibold':
      return { ...baseStyle, fontWeight: '600' };
    case 'secondary':
      return { ...baseStyle, color: colors.textSecondary };
    case 'small':
      return { ...baseStyle, fontSize: 12 };
    case 'large':
      return { ...baseStyle, fontSize: 18 };
    case 'title':
      return { ...baseStyle, fontSize: 20, fontWeight: 'bold' };
    case 'error':
      return { ...baseStyle, color: colors.error };
    case 'success':
      return { ...baseStyle, color: colors.success };
    case 'primary':
      return { ...baseStyle, color: colors.primary };
    default:
      return baseStyle;
  }
}; 