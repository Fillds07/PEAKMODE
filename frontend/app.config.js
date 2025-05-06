const pkg = require('./package.json');

export default {
  expo: {
    name: 'PEAKMODE',
    slug: 'peakmode-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icononly_transparent_nobuffer.png',
    scheme: 'peakmode',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/images/fulllogo_transparent_nobuffer.png',
      resizeMode: 'contain',
      backgroundColor: '#FFFFFF'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.peakmode.app',
      buildNumber: '1',
      icon: './assets/images/icononly_transparent_nobuffer.png',
      infoPlist: {
        NSFaceIDUsageDescription: 'Use Face ID to login to your account'
      }
    },
    android: {
      package: 'com.peakmode.app',
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/images/icononly_transparent_nobuffer.png',
        backgroundColor: '#FFFFFF'
      }
    },
    web: {
      favicon: './assets/images/icononly_transparent_nobuffer.png',
      bundler: 'metro'
    },
    plugins: [
      'expo-router'
    ],
    extra: {
      eas: {
        projectId: 'your-project-id'
      },
      apiUrl: process.env.API_URL
    }
  }
}; 