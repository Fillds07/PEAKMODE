# PEAKMODE Frontend

This is the frontend mobile application for PEAKMODE, built with React Native and Expo.

## Setup Instructions

1. Install dependencies
```bash
cd frontend
npm install
```

2. Start the development server
```bash
npm start
```

3. Running on a physical device or emulator
```bash
# For iOS
npm run ios

# For Android
npm run android
```

## Project Structure

```
frontend/
├── app/                 # Expo Router app directory
│   ├── (tabs)/          # Tab-based navigation
│   ├── screens/         # Screen components
│   └── index.tsx        # Entry point
├── assets/              # Images, fonts, etc.
├── components/          # Reusable UI components
├── constants/           # App constants
├── hooks/               # Custom React hooks
├── services/            # API services
└── package.json         # Dependencies and scripts
```

## App Features

- Authentication (Login, Signup, Password Reset)
- Tab-based navigation
- Profile management
- ... [other features]

## Backend API Integration

The app connects to the PEAKMODE backend API for data services. API configuration is in `services/api.js`.

## Development Notes

- The app uses Expo Secure Store for storing auth tokens
- API requests are automatically intercepted to include auth headers
- Authentication state is managed through the API service 