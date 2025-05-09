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
  
  # Kill ngrok process if running
  if [ ! -z "$NGROK_PID" ]; then
    echo -e "${BLUE}Stopping ngrok tunnel...${NC}"
    kill $NGROK_PID 2>/dev/null
  fi
  
  # Stop MongoDB
  echo -e "${BLUE}Stopping MongoDB...${NC}"
  brew services stop mongodb/brew/mongodb-community@7.0 >/dev/null 2>&1
  
  echo -e "${GREEN}All services stopped successfully!${NC}"
  exit 0
}

# Set up trap to call cleanup function when script terminates
trap cleanup EXIT INT TERM

echo -e "${GREEN}=== PEAKMODE Complete Development Environment (Alternative Method) ===${NC}"
echo -e "${GREEN}Starting MongoDB, Backend, and Frontend with Custom Tunneling${NC}"
echo -e "${GREEN}==============================================================${NC}"

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

# Start the frontend without tunnel mode first
echo -e "${BLUE}Starting frontend in development mode...${NC}"
cd ../frontend

# Ensure the necessary environment variables are set
echo -e "${GREEN}✓ API URL set to: http://${IP_ADDRESS}:5002/api${NC}"

# Start the Expo development server in the background
echo -e "${YELLOW}Starting Expo - clearing cache first...${NC}"
EXPO_PUBLIC_API_HOST=$IP_ADDRESS npm start -- --clear > expo.log 2>&1 &
EXPO_PID=$!

echo -e "${GREEN}✓ Expo development server started (PID: $EXPO_PID)${NC}"
echo -e "${YELLOW}Waiting for Expo to initialize (this may take a minute)...${NC}"
sleep 15 # Give Expo time to start

# Check if Expo server is running
if ! ps -p $EXPO_PID > /dev/null; then
  echo -e "${RED}✗ Failed to start Expo server. Check expo.log for details${NC}"
  exit 1
fi

echo -e "${GREEN}=======================================================${NC}"
echo -e "${GREEN}✓ All services are now running!${NC}"
echo -e "${GREEN}=======================================================${NC}"
echo -e "${BLUE}To test on your device:${NC}"
echo -e "${YELLOW}1. Open Expo Go app${NC}"
echo -e "${YELLOW}2. Scan the QR code from the Expo server (shown in expo.log)${NC}"
echo -e "${YELLOW}3. Or connect to exp://${IP_ADDRESS}:8081${NC}"
echo -e "${GREEN}=======================================================${NC}"
echo -e "${BLUE}Press Ctrl+C to stop all services${NC}"

# Keep the script running until the user presses Ctrl+C
wait $EXPO_PID 