#!/bin/bash

# Colors for better visibility
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== PEAKMODE - Starting Backend and MongoDB ===${NC}"

# Always restart MongoDB to ensure it's running properly
echo -e "${BLUE}Ensuring MongoDB is running properly...${NC}"
brew services restart mongodb/brew/mongodb-community@7.0 > /dev/null
sleep 2
echo -e "${GREEN}✓ MongoDB restarted and running${NC}"

# Test MongoDB connection
echo -e "${BLUE}Testing MongoDB connection...${NC}"
cd backend
node test-mongodb.js
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ MongoDB connection successful${NC}"
else
  echo -e "${RED}✗ MongoDB connection failed${NC}"
  echo -e "${YELLOW}Trying to fix common MongoDB issues...${NC}"
  brew services restart mongodb/brew/mongodb-community@7.0 > /dev/null
  sleep 3
  echo -e "${BLUE}Retesting connection...${NC}"
  node test-mongodb.js
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ MongoDB connection fixed and working${NC}"
  else
    echo -e "${RED}✗ MongoDB connection still failing. Please check your MongoDB installation.${NC}"
    echo -e "${YELLOW}You can try running: brew services restart mongodb/brew/mongodb-community@7.0${NC}"
    echo -e "${YELLOW}Or check the MongoDB logs: brew services list${NC}"
  fi
fi

echo -e "${BLUE}Starting backend server...${NC}"

# Start the dev server
npm run dev
cd .. 