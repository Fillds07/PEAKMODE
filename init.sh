#!/bin/bash

# PEAKMODE Project Initialization Script
# This script checks system requirements and sets up the project environment

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

echo -e "${BOLD}${BLUE}====================================${RESET}"
echo -e "${BOLD}${BLUE}  PEAKMODE Project Initialization  ${RESET}"
echo -e "${BOLD}${BLUE}====================================${RESET}"
echo ""

# Check for Node.js
echo -e "${BOLD}Checking Node.js installation...${RESET}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed.${RESET}"
    echo -e "${YELLOW}Please install Node.js v14 or higher.${RESET}"
    echo "Visit https://nodejs.org/ to download and install."
    exit 1
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js is installed (${NODE_VERSION})${RESET}"
fi

# Check for npm
echo -e "${BOLD}Checking npm installation...${RESET}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed.${RESET}"
    echo -e "${YELLOW}Please install npm (it usually comes with Node.js).${RESET}"
    exit 1
else
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ npm is installed (${NPM_VERSION})${RESET}"
fi

# Check for macOS (for iOS development)
echo -e "${BOLD}Checking operating system...${RESET}"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${GREEN}✓ macOS detected for iOS development${RESET}"
    
    # Check for Xcode (needed for iOS simulator)
    echo -e "${BOLD}Checking for Xcode...${RESET}"
    if ! command -v xcode-select &> /dev/null || [ ! -d "$(xcode-select -p)" ]; then
        echo -e "${YELLOW}⚠️ Xcode command-line tools not detected.${RESET}"
        echo -e "${YELLOW}For iOS simulator, please install Xcode from the App Store.${RESET}"
    else
        echo -e "${GREEN}✓ Xcode is installed${RESET}"
    fi
else
    echo -e "${YELLOW}⚠️ This is not macOS. iOS development may not be fully supported.${RESET}"
fi

# Create required directories
echo -e "${BOLD}Creating required directories...${RESET}"

# Ensure backend data directory exists
if [ ! -d "backend/data" ]; then
    mkdir -p backend/data
    echo -e "${GREEN}✓ Created backend/data directory${RESET}"
else
    echo -e "${GREEN}✓ backend/data directory already exists${RESET}"
fi

# Create run scripts
echo -e "${BOLD}Creating run scripts...${RESET}"

# Create run-backend.sh
cat > run-backend.sh << 'EOF'
#!/bin/bash
# PEAKMODE Backend Start Script
echo -e "\033[1m\033[34mStarting PEAKMODE backend...\033[0m"
cd "$(dirname "$0")/backend"
npm run dev
EOF
chmod +x run-backend.sh
echo -e "${GREEN}✓ Created run-backend.sh${RESET}"

# Create run-frontend.sh
cat > run-frontend.sh << 'EOF'
#!/bin/bash
# PEAKMODE Frontend Start Script
echo -e "\033[1m\033[34mStarting PEAKMODE frontend...\033[0m"
cd "$(dirname "$0")/frontend"
npm start
EOF
chmod +x run-frontend.sh
echo -e "${GREEN}✓ Created run-frontend.sh${RESET}"

# Create print-db.sh
cat > print-db.sh << 'EOF'
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
EOF
chmod +x print-db.sh
echo -e "${GREEN}✓ Created print-db.sh${RESET}"

# Create install script if it doesn't exist
if [ ! -f "install.sh" ]; then
    cat > install.sh << 'EOF'
#!/bin/bash
# PEAKMODE Dependencies Installation Script
echo -e "\033[1m\033[34mInstalling PEAKMODE dependencies...\033[0m"

# Root directory dependencies
echo -e "\033[1mInstalling root dependencies...\033[0m"
npm install

# Backend dependencies
echo -e "\033[1mInstalling backend dependencies...\033[0m"
cd "$(dirname "$0")/backend"
npm install
cd ..

# Frontend dependencies
echo -e "\033[1mInstalling frontend dependencies...\033[0m"
cd "$(dirname "$0")/frontend"
npm install --legacy-peer-deps
cd ..

echo -e "\033[1m\033[32mAll dependencies installed successfully!\033[0m"
echo -e "\033[1m\033[32mYou can now run the app with:\033[0m"
echo -e "\033[1m./run-backend.sh\033[0m (in one terminal)"
echo -e "\033[1m./run-frontend.sh\033[0m (in another terminal)"
echo -e "\033[1m./print-db.sh\033[0m (to inspect database contents)"
EOF
    chmod +x install.sh
    echo -e "${GREEN}✓ Created install.sh${RESET}"
else
    echo -e "${GREEN}✓ install.sh already exists${RESET}"
fi

# Initialization complete
echo ""
echo -e "${BOLD}${GREEN}✓ Project initialization complete!${RESET}"
echo ""
echo -e "${BOLD}What's next:${RESET}"
echo -e "1. Install dependencies:  ${BOLD}./install.sh${RESET}"
echo -e "2. Start the backend:     ${BOLD}./run-backend.sh${RESET}"
echo -e "3. Start the frontend:    ${BOLD}./run-frontend.sh${RESET}"
echo -e "4. View database:         ${BOLD}./print-db.sh${RESET}"
echo "" 