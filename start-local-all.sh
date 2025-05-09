#!/bin/bash

# Set colors for better visibility
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

echo -e "${GREEN}=== PEAKMODE Local Development Environment ===${NC}"
echo -e "${GREEN}Starting MongoDB, Backend, and Frontend${NC}"
echo -e "${GREEN}==========================================${NC}"

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

# Start the frontend 
echo -e "${BLUE}Starting frontend...${NC}"
cd ..
export API_URL="http://localhost:5002/api"
echo -e "${GREEN}✓ API URL set to: ${API_URL}${NC}"
cd frontend
echo -e "${YELLOW}Starting Expo - this may take a moment...${NC}"
npm start

# The script will call cleanup via the trap when terminated 