#!/bin/bash

# PEAKMODE Database Print Script

# ANSI color codes
BLUE='\033[0;34m'
RED='\033[0;31m'
BOLD='\033[1m'
RESET='\033[0m'

echo -e "${BOLD}${BLUE}============================${RESET}"
echo -e "${BOLD}${BLUE}  PEAKMODE Database Viewer  ${RESET}"
echo -e "${BOLD}${BLUE}============================${RESET}"
echo ""

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo -e "${RED}Error: Backend directory not found.${RESET}"
    echo -e "${RED}Make sure you're running this script from the project root.${RESET}"
    exit 1
fi

# Check if node_modules exists in backend
if [ ! -d "backend/node_modules" ]; then
    echo -e "${RED}Error: Backend dependencies not installed.${RESET}"
    echo -e "${RED}Please run ./install.sh first.${RESET}"
    exit 1
fi

# Run the database print script
echo -e "${BOLD}Printing database contents...${RESET}"
cd backend && npm run db:print
