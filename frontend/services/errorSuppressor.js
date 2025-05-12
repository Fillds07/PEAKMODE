/**
 * Error Suppressor Service
 * 
 * This module provides utility functions to suppress error overlays in React Native
 * and handle errors in a consistent way throughout the app.
 */

// Hide any error/alert elements in the DOM
export const hideErrorOverlays = () => {
  // For web/browser-based environments
  if (typeof document !== 'undefined') {
    // Hide any elements with role="alert" (standard alerts)
    const alerts = document.querySelectorAll('[role="alert"]');
    alerts.forEach(alert => {
      alert.style.display = 'none';
    });
    
    // Hide specific error containers from various libraries
    const errorContainers = document.querySelectorAll(
      '.error-navigation-container, .form-error-message, .error-boundary'
    );
    errorContainers.forEach(container => {
      container.style.display = 'none';
    });
    
    // Add a style to globally hide these elements
    if (!document.getElementById('error-overlay-suppressor')) {
      const style = document.createElement('style');
      style.id = 'error-overlay-suppressor';
      style.innerHTML = `
        [role="alert"],
        .error-navigation-container,
        .form-error-message,
        .error-boundary {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  }
};

// Create a specialized error that will be handled silently
export class HandledError extends Error {
  constructor(message) {
    super(message);
    this.name = 'HandledError';
    this.isHandled = true; // Flag to prevent error overlay
  }
}

// Error handler with safe logging (won't trigger overlays)
export const handleError = (error, setErrorFunction = null) => {
  // Convert to HandledError to prevent overlays
  const handledError = new HandledError(
    error?.message || 'An unknown error occurred'
  );
  
  // Safe console logging that won't trigger overlays
  if (process.env.NODE_ENV === 'development') {
    // Only log in development
    console.log(
      'Error handled:',
      error?.message || 'Unknown error',
      error?.stack ? '\n' + error.stack : ''
    );
  }
  
  // Update UI state if setter provided
  if (setErrorFunction && typeof setErrorFunction === 'function') {
    setErrorFunction(handledError.message);
  }
  
  return handledError;
};

// Initialize error suppression (call this in your layout or app init)
export const initializeErrorSuppression = () => {
  // Immediately hide any existing overlays
  hideErrorOverlays();
  
  // Set interval to periodically check and hide new overlays
  const checkInterval = setInterval(hideErrorOverlays, 1000);
  
  // Return cleanup function
  return () => clearInterval(checkInterval);
};

export default {
  hideErrorOverlays,
  HandledError,
  handleError,
  initializeErrorSuppression
}; 