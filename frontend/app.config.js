const pkg = require('./package.json');
const { hostname } = require('os');
const path = require('path');

// Dynamic API URL setup for development
const getDefaultApiUrl = () => {
  // Get all environment variables
  const devServerHost = process.env.EXPO_DEVSERVER_HOST || process.env.EXPO_PUBLIC_API_HOST;
  
  // If running in a dev client with explicit host setting, use that
  if (devServerHost) {
    // Extract just the hostname or IP from the dev server host (remove port if present)
    const host = devServerHost.split(':')[0];
    return `http://${host}:5003/api`;
  }

  return 'http://localhost:5003/api';
};

// Get absolute path to assets to ensure they're found correctly
const getAssetPath = (relativePath) => {
  return path.resolve(__dirname, relativePath);
};

// Make sure icon exists before using it
const DEFAULT_ICON = './assets/images/icononly_transparent_nobuffer.png';
const DEFAULT_SPLASH = './assets/images/fulllogo_transparent_nobuffer.png';

export default {
  expo: {
    name: 'PEAKMODE',
    slug: 'peakmode-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: DEFAULT_ICON,
    scheme: 'peakmode',
    userInterfaceStyle: 'light',
    splash: {
      image: DEFAULT_SPLASH,
      resizeMode: 'contain',
      backgroundColor: '#FFFFFF'
    },
    assetBundlePatterns: [
      "assets/**/*", // Include all assets
      "**/*"        // Include everything else
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.peakmode.app',
      buildNumber: '1',
      icon: DEFAULT_ICON,
      infoPlist: {
        NSFaceIDUsageDescription: 'Use Face ID to login to your account'
      }
    },
    android: {
      package: 'com.peakmode.app',
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: DEFAULT_ICON,
        backgroundColor: '#FFFFFF'
      }
    },
    web: {
      favicon: DEFAULT_ICON,
      bundler: 'metro'
    },
    plugins: [
      'expo-router'
    ],
    extra: {
      eas: {
        projectId: 'your-project-id'
      },
      // Use explicit environment variable if available, otherwise use dynamically determined URL
      apiUrl: process.env.API_URL || getDefaultApiUrl(),
      // Add public API host variable that can be used at runtime
      expoPublicApiHost: process.env.EXPO_PUBLIC_API_HOST,
      // Flag to indicate we're using local development setup
      isLocalDev: !process.env.API_URL,
      // App version from package.json
      appVersion: pkg.version,
      // Build timestamp
      buildTimestamp: new Date().toISOString()
    }
  }
}; 