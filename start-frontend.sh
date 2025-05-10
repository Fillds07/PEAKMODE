#!/bin/bash

# Colors for better visibility
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to get the local IP address
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

echo -e "${GREEN}=== PEAKMODE - Starting Frontend ===${NC}"

# Get the IP address
IP_ADDRESS=$(get_local_ip)

if [ -z "$IP_ADDRESS" ]; then
  echo -e "${YELLOW}Could not determine IP address. Using localhost.${NC}"
  IP_ADDRESS="localhost"
fi

echo -e "${BLUE}Using IP address: ${IP_ADDRESS}${NC}"

# Parse command-line arguments
USE_TUNNEL=false

if [ "$1" = "--tunnel" ]; then
  USE_TUNNEL=true
fi

# Change to frontend directory
cd frontend

# Export the IP so app.config.js picks it up for API requests
export EXPO_PUBLIC_API_HOST=$IP_ADDRESS

echo -e "${BLUE}Starting Expo development server...${NC}"

# Start Expo with the appropriate mode
if [ "$USE_TUNNEL" = true ]; then
  echo -e "${GREEN}Using tunnel mode - accessible from external networks${NC}"
  npx expo start --tunnel
else
  echo -e "${GREEN}Using LAN mode - only accessible from local network${NC}"
  npx expo start --lan
fi 