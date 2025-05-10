#!/bin/bash

# Colors for better visibility
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== PEAKMODE - Installing All Dependencies ===${NC}"

# Check if MongoDB is installed
echo -e "${GREEN}=== Database Setup ===${NC}"
if command -v mongod &> /dev/null; then
    echo -e "${BLUE}MongoDB already installed${NC}"
else
    echo -e "${YELLOW}MongoDB not found. Do you want to install it? (y/n)${NC}"
    read -r answer
    if [[ "$answer" =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Installing MongoDB...${NC}"
        if command -v brew &> /dev/null; then
            brew tap mongodb/brew
            brew install mongodb-community@7.0
            echo -e "${GREEN}MongoDB installed successfully!${NC}"
        else
            echo -e "${RED}Homebrew not found. Please install MongoDB manually:${NC}"
            echo -e "${YELLOW}Visit: https://www.mongodb.com/docs/manual/installation/${NC}"
        fi
    else
        echo -e "${YELLOW}Skipping MongoDB installation. Make sure it's installed before starting the backend.${NC}"
    fi
fi

# Install backend dependencies
echo -e "\n${GREEN}=== Backend Dependencies ===${NC}"
echo -e "${BLUE}Installing backend packages...${NC}"
cd backend
npm install
echo -e "${GREEN}Backend dependencies installed successfully!${NC}"
cd ..

# Install frontend dependencies
echo -e "\n${GREEN}=== Frontend Dependencies ===${NC}"
echo -e "${BLUE}Installing frontend packages (with legacy peer deps)...${NC}"
cd frontend
npm install --legacy-peer-deps
echo -e "${GREEN}Frontend dependencies installed successfully!${NC}"
cd ..

echo -e "\n${GREEN}=== Installation Complete! ===${NC}"
echo -e "${BLUE}✓ Database: MongoDB${NC}"
echo -e "${BLUE}✓ Backend: Node.js dependencies${NC}"
echo -e "${BLUE}✓ Frontend: React Native & Expo dependencies${NC}"
echo -e "\n${GREEN}You can now start the application with:${NC}"
echo -e "  ./start-backend.sh     (in one terminal)"
echo -e "  ./start-frontend.sh    (in another terminal)" 