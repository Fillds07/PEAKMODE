#!/bin/bash

# Colors for better visibility
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Clean up function to handle script termination
cleanup() {
  echo -e "\n${YELLOW}Shutting down all services...${NC}"
  
  # Kill backend process if running
  if [ ! -z "$BACKEND_PID" ]; then
    echo -e "${BLUE}Stopping backend server...${NC}"
    kill $BACKEND_PID 2>/dev/null
  fi
  
  # Stop MongoDB
  echo -e "${BLUE}Stopping MongoDB...${NC}"
  brew services stop mongodb/brew/mongodb-community@7.0 >/dev/null 2>&1
  
  echo -e "${GREEN}All services stopped successfully!${NC}"
  exit 0
}

# Set up trap to call cleanup function when script terminates
trap cleanup EXIT INT TERM

echo -e "${GREEN}=== PEAKMODE Complete Development Environment ===${NC}"
echo -e "${GREEN}Starting MongoDB, Backend, and Frontend with Tunnel Mode${NC}"
echo -e "${GREEN}===================================================${NC}"

# Pre-install ngrok for tunneling (required for tunnel mode)
echo -e "${BLUE}Installing @expo/ngrok for tunneling...${NC}"
npm install -g @expo/ngrok@^4.1.0
npm install --prefix ./frontend @expo/ngrok@^4.1.0

# Create .env file for frontend with EXPO_TUNNEL setting
echo -e "${BLUE}Setting up Expo environment variables...${NC}"
cat > ./frontend/.env << EOF
EXPO_TUNNEL=1
NODE_OPTIONS=--no-experimental-fetch
EOF

# Start MongoDB if not already running
if ! brew services list | grep mongodb-community@7.0 | grep started > /dev/null; then
  echo -e "${BLUE}Starting MongoDB locally...${NC}"
  brew services start mongodb/brew/mongodb-community@7.0 > /dev/null
  sleep 2
  echo -e "${GREEN}✓ MongoDB started${NC}"
else
  echo -e "${GREEN}✓ MongoDB is already running${NC}"
fi

# Start the backend in background
echo -e "${BLUE}Starting backend server...${NC}"
cd "$(dirname "$0")/backend"
NODE_ENV=development npm run dev & 
BACKEND_PID=$!

# Wait for backend to initialize
echo -e "${BLUE}Waiting for backend to initialize...${NC}"
sleep 5

# Check if backend is actually running
if ps -p $BACKEND_PID > /dev/null; then
  echo -e "${GREEN}✓ Backend server started (PID: $BACKEND_PID)${NC}"
else
  echo -e "${RED}✗ Failed to start backend server${NC}"
  exit 1
fi

# Get the IP address
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

# Start the frontend with tunnel mode
echo -e "${BLUE}Starting frontend with tunnel mode...${NC}"
cd ../frontend

# Check if npx is available in PATH
if ! command -v npx &> /dev/null; then
  echo -e "${RED}npx command not found. Installing...${NC}"
  npm install -g npx
fi

echo -e "${GREEN}✓ API URL set to: http://${IP_ADDRESS}:5002/api${NC}"
echo -e "${YELLOW}Starting Expo with tunnel - this may take a moment...${NC}"
echo -e "${GREEN}=======================================================${NC}"
echo -e "${GREEN}When the QR code appears:${NC}"
echo -e "${BLUE}- Share it with testers or your professor${NC}"
echo -e "${BLUE}- They can scan it from any network to access the app${NC}"
echo -e "${BLUE}- All connections will be tunneled to your machine${NC}"
echo -e "${GREEN}=======================================================${NC}"
echo -e "${YELLOW}Note: If prompted to install @expo/ngrok again, select yes${NC}"

# Clear the cache and use tunnel mode for cross-network access
# Using direct expo CLI instead of npx for better tunneling support
EXPO_PUBLIC_API_HOST=$IP_ADDRESS expo start --tunnel --clear

# The script will call cleanup via the trap when terminated 