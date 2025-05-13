#!/bin/bash

# PEAKMODE Dependencies Installation Script

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

echo -e "${BOLD}${BLUE}======================================${RESET}"
echo -e "${BOLD}${BLUE}  PEAKMODE Dependencies Installation  ${RESET}"
echo -e "${BOLD}${BLUE}======================================${RESET}"
echo ""

# Check if init.sh was run
if [ ! -f "run-backend.sh" ] || [ ! -f "run-frontend.sh" ]; then
    echo -e "${RED}Error: It looks like init.sh hasn't been run yet.${RESET}"
    echo -e "${YELLOW}Please run ./init.sh first to initialize the project.${RESET}"
    exit 1
fi

# Root directory dependencies
echo -e "${BOLD}Installing root dependencies...${RESET}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install root dependencies.${RESET}"
    exit 1
fi
echo -e "${GREEN}✓ Root dependencies installed${RESET}"
echo ""

# Backend dependencies
echo -e "${BOLD}Installing backend dependencies...${RESET}"
cd "$(dirname "$0")/backend"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install backend dependencies.${RESET}"
    exit 1
fi
echo -e "${GREEN}✓ Backend dependencies installed${RESET}"
echo ""

# Create data directory if it doesn't exist
if [ ! -d "data" ]; then
    mkdir -p data
    echo -e "${GREEN}✓ Created data directory for SQLite database${RESET}"
fi

# Return to root directory
cd ..

# Frontend dependencies
echo -e "${BOLD}Installing frontend dependencies...${RESET}"
cd "$(dirname "$0")/frontend"
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install frontend dependencies.${RESET}"
    exit 1
fi
echo -e "${GREEN}✓ Frontend dependencies installed${RESET}"

# Return to root directory
cd ..

echo ""
echo -e "${BOLD}${GREEN}✓ All dependencies installed successfully!${RESET}"
echo ""
echo -e "${BOLD}What's next:${RESET}"
echo -e "1. Start the backend:     ${BOLD}./run-backend.sh${RESET}"
echo -e "2. Start the frontend:    ${BOLD}./run-frontend.sh${RESET}"
echo -e "3. View database:         ${BOLD}./print-db.sh${RESET}"
echo "" 