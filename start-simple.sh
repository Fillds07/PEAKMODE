#!/bin/bash

# Colors for better visibility
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== PEAKMODE Simple Launcher ===${NC}"
echo -e "${GREEN}Starting MongoDB, Backend, and Frontend${NC}"
echo -e "${GREEN}===================================${NC}"

# Start MongoDB if not already running
if ! brew services list | grep mongodb-community@7.0 | grep started > /dev/null; then
  echo -e "${BLUE}Starting MongoDB locally...${NC}"
  brew services start mongodb/brew/mongodb-community@7.0 > /dev/null
  sleep 2
  echo -e "${GREEN}✓ MongoDB started${NC}"
else
  echo -e "${GREEN}✓ MongoDB is already running${NC}"
fi

# Start the backend server in a new terminal window
echo -e "${BLUE}Starting backend server in a new terminal...${NC}"
osascript -e "tell app \"Terminal\" to do script \"cd $(pwd)/backend && npm run dev\"" &
sleep 3
echo -e "${GREEN}✓ Backend server started in a new terminal window${NC}"

# First, update dependencies and fix peer dependency issues
echo -e "${BLUE}Updating project dependencies...${NC}"
cd frontend

# Fix the package versions in package.json
echo -e "${BLUE}Fixing package versions...${NC}"
cat > package.fix.json << 'EOF'
{
  "name": "peakmode-app",
  "main": "expo-router/entry",
  "version": "1.0.0",
  "scripts": {
    "start": "expo start",
    "reset-project": "node ./scripts/reset-project.js",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "jest --watchAll",
    "lint": "expo lint",
    "tunnel": "EXPO_TUNNEL=1 expo start --clear"
  },
  "jest": {
    "preset": "jest-expo"
  },
  "dependencies": {
    "@expo/ngrok": "^4.1.0",
    "@expo/vector-icons": "^14.1.0",
    "@react-native-async-storage/async-storage": "^2.1.2",
    "@react-native-clipboard/clipboard": "^1.16.2",
    "@react-native-community/datetimepicker": "^8.3.0",
    "@react-navigation/bottom-tabs": "^7.3.11",
    "@react-navigation/native": "^7.1.7",
    "@react-navigation/native-stack": "^7.3.11",
    "@reduxjs/toolkit": "^2.7.0",
    "@rneui/base": "4.0.0-rc.7",
    "@rneui/themed": "4.0.0-rc.8",
    "axios": "^1.9.0",
    "expo": "~53.0.9",
    "expo-blur": "^14.1.4",
    "expo-constants": "~17.1.6",
    "expo-font": "^13.3.1",
    "expo-haptics": "^14.1.4",
    "expo-image-picker": "^16.1.4",
    "expo-linear-gradient": "~14.1.4",
    "expo-linking": "~7.1.1",
    "expo-network": "^7.1.5",
    "expo-router": "~5.0.6",
    "expo-secure-store": "~14.2.3",
    "expo-splash-screen": "^0.30.8",
    "expo-status-bar": "~2.2.3",
    "expo-web-browser": "^14.1.6",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "react-native": "0.79.2",
    "react-native-gesture-handler": "^2.24.0",
    "react-native-reanimated": "^3.17.5",
    "react-native-safe-area-context": "^5.4.0",
    "react-native-screens": "^4.10.0",
    "react-native-vector-icons": "^10.2.0",
    "react-native-web": "^0.20.0",
    "react-native-webview": "^13.13.5",
    "react-redux": "^9.2.0"
  },
  "devDependencies": {
    "@babel/core": "^7.25.2",
    "@types/react": "^19.0.10",
    "jest-expo": "~53.0.5",
    "typescript": "^5.3.3"
  },
  "private": true,
  "config": {
    "apiUrl": {
      "development": "http://localhost:5002/api",
      "production": "https://peakmode-backend.eba-6pcej9t8.us-east-1.elasticbeanstalk.com/api"
    }
  }
}
EOF

# Backup original package.json
mv package.json package.json.bak
# Apply the fixed package.json
mv package.fix.json package.json

# Install dependencies with the fixes
echo -e "${BLUE}Installing fixed dependencies...${NC}"
npm install --legacy-peer-deps

# Create .env file for Expo tunnel - FIXED to remove incorrect Node option
echo -e "${BLUE}Setting up environment variables for tunneling...${NC}"
cat > .env << EOF
EXPO_TUNNEL=1
EOF

# Get the IP address for API URL
get_local_ip() {
  case "$(uname -s)" in
    Darwin)
      # MacOS
      ipconfig getifaddr en0 || ipconfig getifaddr en1
      ;;
    Linux)
      # Linux
      hostname -I | awk '{print $1}'
      ;;
    CYGWIN*|MINGW*|MSYS*)
      # Windows
      ipconfig | grep -i "IPv4 Address" | head -n 1 | awk -F': ' '{print $2}'
      ;;
    *)
      echo "Unknown OS"
      exit 1
      ;;
  esac
}

IP_ADDRESS=$(get_local_ip)
if [ -z "$IP_ADDRESS" ]; then
  echo -e "${YELLOW}Could not determine IP address. Using localhost.${NC}"
  IP_ADDRESS="localhost"
fi

# Finally, run the frontend with tunnel mode
echo -e "${BLUE}Starting frontend with tunnel mode...${NC}"
echo -e "${YELLOW}This may take a moment to start...${NC}"
echo -e "${GREEN}=======================================================${NC}"
echo -e "${GREEN}Connecting to: ${IP_ADDRESS}:5002${NC}"
echo -e "${GREEN}When the QR code appears:${NC}"
echo -e "${BLUE}- Share it with testers or your professor${NC}"
echo -e "${BLUE}- They can scan it from any network to access the app${NC}"
echo -e "${GREEN}=======================================================${NC}"

EXPO_PUBLIC_API_HOST=$IP_ADDRESS EXPO_TUNNEL=1 npx expo start --clear 