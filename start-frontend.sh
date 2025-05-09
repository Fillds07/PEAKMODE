#!/bin/bash

# Colors for better visibility
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== PEAKMODE - Starting Frontend Only ===${NC}"
echo -e "${BLUE}This will start the Expo development server${NC}"
echo -e "${BLUE}Look for the QR code in the output below${NC}"
echo ""

# Change to frontend directory
cd frontend

# Determine local IP address for API host
IP_ADDRESS=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)
echo "Using API host: $IP_ADDRESS"

# Export the IP so app.config.js picks it up for API requests
export EXPO_PUBLIC_API_HOST=$IP_ADDRESS

# Start Expo in LAN mode (devices on same Wi-Fi can connect)
npx expo start --lan 