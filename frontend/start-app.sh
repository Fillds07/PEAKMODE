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

# Check if the backend is running on port 5002
check_backend() {
  if nc -z localhost 5002 2>/dev/null; then
    echo -e "${GREEN}✓ Backend is running on port 5002${NC}"
    return 0
  else
    echo -e "${RED}✗ Backend is not running on port 5002${NC}"
    return 1
  fi
}

# Check if MongoDB is running
check_mongodb() {
  if pgrep -x mongod >/dev/null || (command -v brew >/dev/null && brew services list | grep mongodb | grep started >/dev/null); then
    echo -e "${GREEN}✓ MongoDB appears to be running${NC}"
    return 0
  else
    echo -e "${YELLOW}! Could not confirm if MongoDB is running${NC}"
    return 1
  fi
}

# Get the IP address
IP_ADDRESS=$(get_local_ip)

if [ -z "$IP_ADDRESS" ]; then
  echo -e "${YELLOW}Could not determine IP address. Using localhost.${NC}"
  IP_ADDRESS="localhost"
fi

# Parse command-line arguments
USE_TUNNEL=false
CLEAR_CACHE=false
UPDATE_DEPS=false

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --tunnel) USE_TUNNEL=true ;;
    --no-tunnel) USE_TUNNEL=false ;;
    --clear) CLEAR_CACHE=true ;;
    --update) UPDATE_DEPS=true ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
  shift
done

echo -e "${GREEN}=== PEAKMODE App Launcher ===${NC}"
echo -e "${BLUE}Using IP address: ${IP_ADDRESS}${NC}"

# Check if we're in the frontend directory
if [ ! -d "./app" ] && [ -d "../frontend/app" ]; then
  echo -e "${YELLOW}Changing to frontend directory...${NC}"
  cd ../frontend
fi

# Update dependencies if requested
if [ "$UPDATE_DEPS" = true ]; then
  echo -e "${BLUE}Updating npm dependencies...${NC}"
  npm install
  echo -e "${GREEN}Dependencies updated!${NC}"
fi

# Check if backend is running
if ! check_backend; then
  echo -e "${YELLOW}The backend server is not running. Do you want to start it? (y/n)${NC}"
  read -r answer
  if [[ "$answer" =~ ^[Yy]$ ]]; then
    # Start the backend
    echo -e "${BLUE}Starting backend server in a new terminal...${NC}"
    
    # Determine the script location and path to backend starter
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    ROOT_DIR="$(dirname "$SCRIPT_DIR")"
    BACKEND_SCRIPT="$ROOT_DIR/start-backend.sh"
    
    if [ -f "$BACKEND_SCRIPT" ]; then
      # Use different approaches based on OS
      case "$(uname -s)" in
        Darwin)
          # MacOS - use open with a new Terminal window
          osascript -e "tell app \"Terminal\" to do script \"$BACKEND_SCRIPT\"" &
          ;;
        Linux)
          # Linux - use x-terminal-emulator if available
          if command -v x-terminal-emulator >/dev/null; then
            x-terminal-emulator -e "$BACKEND_SCRIPT" &
          else
            # Try with gnome-terminal
            gnome-terminal -- "$BACKEND_SCRIPT" 2>/dev/null || 
            xterm -e "$BACKEND_SCRIPT" 2>/dev/null || 
            echo -e "${RED}Cannot automatically open terminal. Please open a new terminal and run:${NC} $BACKEND_SCRIPT"
          fi
          ;;
        *)
          echo -e "${RED}Cannot automatically start backend on this OS. Please open a new terminal and run:${NC} $BACKEND_SCRIPT"
          ;;
      esac
      
      echo -e "${YELLOW}Waiting for backend to start...${NC}"
      sleep 5
    else
      echo -e "${RED}Backend start script not found at: $BACKEND_SCRIPT${NC}"
      echo -e "${YELLOW}Please start the backend manually in another terminal window with:${NC}"
      echo -e "cd \"$ROOT_DIR/backend\" && npm run dev"
    fi
  else
    echo -e "${YELLOW}Continuing without backend. The app will not be able to connect to the API.${NC}"
  fi
fi

# Run the app with the proper environment variables
echo -e "${BLUE}Starting frontend application...${NC}"

# Ask user about connecting from other networks
if [ "$USE_TUNNEL" != true ]; then
  echo -e "${YELLOW}Will you need to connect from devices on other networks? (y/n)${NC}"
  read -r use_tunnel_answer
  if [[ "$use_tunnel_answer" =~ ^[Yy]$ ]]; then
    USE_TUNNEL=true
  fi
fi

# Default command without cache clearing
CMD="EXPO_PUBLIC_API_HOST=$IP_ADDRESS npx expo start"

# Add tunnel if requested
if [ "$USE_TUNNEL" = true ]; then
  echo -e "${GREEN}Using tunnel mode for cross-network access${NC}"
  CMD="$CMD --tunnel"
else 
  echo -e "${BLUE}Using local network mode - devices must be on the same network${NC}"
fi

# Add cache clearing if requested
if [ "$CLEAR_CACHE" = true ]; then
  echo -e "${YELLOW}Clearing Metro bundler cache...${NC}"
  CMD="$CMD --clear"
fi

# Display helpful information
echo -e "${GREEN}=======================================================${NC}"
echo -e "${GREEN}Starting app with the following configuration:${NC}"
echo -e "${BLUE}- API Host: ${NC}${IP_ADDRESS}:5002"
echo -e "${BLUE}- Tunnel Mode: ${NC}$([ "$USE_TUNNEL" = true ] && echo "Enabled" || echo "Disabled")"
echo -e "${BLUE}- Cache Clear: ${NC}$([ "$CLEAR_CACHE" = true ] && echo "Yes" || echo "No")"
echo -e "${GREEN}=======================================================${NC}"
echo -e "${YELLOW}If you see asset errors, make sure all image paths in your code use the correct paths${NC}"
echo -e "${YELLOW}To resolve connectivity issues, try restarting with:${NC}"
echo -e "${YELLOW}  ./start-app.sh --tunnel --clear${NC}"
echo -e "${GREEN}=======================================================${NC}"

# Execute the command
eval "$CMD" 