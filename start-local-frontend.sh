#!/bin/bash

# Set colors for better visibility
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Set local API URL for frontend
export API_URL="http://localhost:5002/api"

# Navigate to frontend directory and start
echo -e "${GREEN}Starting frontend with local API URL: ${YELLOW}${API_URL}${NC}"
cd "$(dirname "$0")/frontend"

# Check for node_modules
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/expo" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Start the app
echo -e "${GREEN}Starting Expo development server...${NC}"
npm start 