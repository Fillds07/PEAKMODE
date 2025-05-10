#!/bin/bash

# Colors for better visibility
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== PEAKMODE - First-Time Setup ===${NC}"

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Darwin*)    OS_TYPE="MacOS" ;;
    Linux*)     OS_TYPE="Linux" ;;
    MINGW*|MSYS*|CYGWIN*) OS_TYPE="Windows" ;;
    *)          OS_TYPE="Unknown" ;;
esac

echo -e "${BLUE}Detected operating system: ${OS_TYPE}${NC}"

# Function to check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Make scripts executable
echo -e "\n${GREEN}=== Making Scripts Executable ===${NC}"
chmod +x install.sh start-backend.sh start-frontend.sh start-backend-tunnel.sh
echo -e "${BLUE}✓ Scripts are now executable${NC}"

# Check and install Node.js
echo -e "\n${GREEN}=== Checking Node.js and npm ===${NC}"
if command_exists node; then
    NODE_VERSION=$(node -v)
    echo -e "${BLUE}✓ Node.js is installed (${NODE_VERSION})${NC}"
else
    echo -e "${YELLOW}Node.js not found. Installing...${NC}"
    
    if [ "$OS_TYPE" = "MacOS" ]; then
        if command_exists brew; then
            brew install node
        else
            echo -e "${YELLOW}Homebrew not found. Installing...${NC}"
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            brew install node
        fi
    elif [ "$OS_TYPE" = "Linux" ]; then
        if command_exists apt; then
            sudo apt update
            sudo apt install -y nodejs npm
        else
            echo -e "${RED}Package manager not found. Please install Node.js manually:${NC}"
            echo -e "${YELLOW}Visit: https://nodejs.org/en/download/${NC}"
        fi
    elif [ "$OS_TYPE" = "Windows" ]; then
        echo -e "${RED}Please install Node.js manually:${NC}"
        echo -e "${YELLOW}Visit: https://nodejs.org/en/download/${NC}"
    fi
    
    if command_exists node; then
        NODE_VERSION=$(node -v)
        echo -e "${GREEN}✓ Node.js successfully installed (${NODE_VERSION})${NC}"
    else
        echo -e "${RED}Failed to install Node.js automatically. Please install manually:${NC}"
        echo -e "${YELLOW}Visit: https://nodejs.org/en/download/${NC}"
    fi
fi

# Check and install MongoDB
echo -e "\n${GREEN}=== Checking MongoDB ===${NC}"
if command_exists mongod; then
    MONGO_VERSION=$(mongod --version | head -n 1)
    echo -e "${BLUE}✓ MongoDB is installed (${MONGO_VERSION})${NC}"
else
    echo -e "${YELLOW}MongoDB not found. Installing...${NC}"
    
    if [ "$OS_TYPE" = "MacOS" ]; then
        if command_exists brew; then
            brew tap mongodb/brew
            brew install mongodb-community@7.0
            brew services start mongodb/brew/mongodb-community@7.0
        else
            echo -e "${RED}Homebrew not found. Please install MongoDB manually:${NC}"
            echo -e "${YELLOW}Visit: https://www.mongodb.com/docs/manual/installation/${NC}"
        fi
    elif [ "$OS_TYPE" = "Linux" ]; then
        if command_exists apt; then
            # Import MongoDB public GPG key
            curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
                sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
                --dearmor
            
            # Create list file for MongoDB
            echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
                sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
            
            # Install MongoDB
            sudo apt-get update
            sudo apt-get install -y mongodb-org
            sudo systemctl start mongod
            sudo systemctl enable mongod
        else
            echo -e "${RED}Package manager not found. Please install MongoDB manually:${NC}"
            echo -e "${YELLOW}Visit: https://www.mongodb.com/docs/manual/installation/${NC}"
        fi
    elif [ "$OS_TYPE" = "Windows" ]; then
        echo -e "${RED}Please install MongoDB manually:${NC}"
        echo -e "${YELLOW}Visit: https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-windows/${NC}"
    fi
    
    if command_exists mongod; then
        MONGO_VERSION=$(mongod --version | head -n 1)
        echo -e "${GREEN}✓ MongoDB successfully installed (${MONGO_VERSION})${NC}"
    else
        echo -e "${RED}Failed to install MongoDB automatically. Please install manually:${NC}"
        echo -e "${YELLOW}Visit: https://www.mongodb.com/docs/manual/installation/${NC}"
    fi
fi

# Check and install Expo CLI
echo -e "\n${GREEN}=== Checking Expo CLI ===${NC}"
if command_exists expo; then
    EXPO_VERSION=$(expo --version)
    echo -e "${BLUE}✓ Expo CLI is installed (${EXPO_VERSION})${NC}"
else
    echo -e "${YELLOW}Expo CLI not found. Installing...${NC}"
    npm install -g expo-cli
    
    if command_exists expo; then
        EXPO_VERSION=$(expo --version)
        echo -e "${GREEN}✓ Expo CLI successfully installed (${EXPO_VERSION})${NC}"
    else
        echo -e "${RED}Failed to install Expo CLI. Trying npx approach instead.${NC}"
        echo -e "${BLUE}This will use npx to run Expo commands when needed.${NC}"
    fi
fi

# Check if ngrok is installed (optional for tunneling)
echo -e "\n${GREEN}=== Checking ngrok (Optional) ===${NC}"
if command_exists ngrok; then
    NGROK_VERSION=$(ngrok --version)
    echo -e "${BLUE}✓ ngrok is installed (${NGROK_VERSION})${NC}"
else
    echo -e "${YELLOW}ngrok not found. This is optional for external tunneling.${NC}"
    echo -e "${YELLOW}Do you want to install ngrok? (y/n)${NC}"
    read -r answer
    if [[ "$answer" =~ ^[Yy]$ ]]; then
        if [ "$OS_TYPE" = "MacOS" ]; then
            if command_exists brew; then
                brew install ngrok/ngrok/ngrok
            else
                echo -e "${RED}Homebrew not found. Please install ngrok manually:${NC}"
                echo -e "${YELLOW}Visit: https://ngrok.com/download${NC}"
            fi
        elif [ "$OS_TYPE" = "Linux" ]; then
            # Download and install ngrok
            curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | \
                sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && \
                echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | \
                sudo tee /etc/apt/sources.list.d/ngrok.list && \
                sudo apt update && sudo apt install ngrok
        elif [ "$OS_TYPE" = "Windows" ]; then
            echo -e "${RED}Please install ngrok manually:${NC}"
            echo -e "${YELLOW}Visit: https://ngrok.com/download${NC}"
        fi
        
        if command_exists ngrok; then
            NGROK_VERSION=$(ngrok --version)
            echo -e "${GREEN}✓ ngrok successfully installed (${NGROK_VERSION})${NC}"
            
            echo -e "${YELLOW}Don't forget to set up your ngrok authtoken:${NC}"
            echo -e "${BLUE}    ngrok config add-authtoken YOUR_TOKEN${NC}"
            echo -e "${YELLOW}Get your token at https://dashboard.ngrok.com/get-started/your-authtoken${NC}"
        else
            echo -e "${RED}Failed to install ngrok. Please install manually if needed:${NC}"
            echo -e "${YELLOW}Visit: https://ngrok.com/download${NC}"
        fi
    else
        echo -e "${BLUE}Skipping ngrok installation. You can still install it later if needed.${NC}"
    fi
fi

echo -e "\n${GREEN}=== First-Time Setup Complete! ===${NC}"
echo -e "${BLUE}Your environment is now ready for PEAKMODE development.${NC}"
echo -e "\n${GREEN}Next Steps:${NC}"
echo -e "1. Run ${YELLOW}./install.sh${NC} to install project dependencies"
echo -e "2. Run ${YELLOW}./start-backend.sh${NC} to start the backend server"
echo -e "3. Run ${YELLOW}./start-frontend.sh${NC} to start the frontend application"
echo -e "\n${BLUE}Happy coding!${NC}" 