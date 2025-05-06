#!/bin/bash

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}MongoDB Atlas Access Configuration Helper${NC}"
echo "=============================================="
echo ""

# Get current IP address
echo -e "${BLUE}Checking your current public IP address...${NC}"
PUBLIC_IP=$(curl -s https://api.ipify.org?format=json | sed 's/{"ip":"\(.*\)"}/\1/')

if [ -z "$PUBLIC_IP" ]; then
  echo -e "${RED}Failed to retrieve your public IP.${NC}"
  PUBLIC_IP="unknown"
else
  echo -e "${GREEN}Your public IP address is: ${PUBLIC_IP}${NC}"
fi

# AWS Elastic Beanstalk environment
EB_ENV="peakmode-backend.eba-6pcej9t8.us-east-1.elasticbeanstalk.com"

echo -e "\n${BOLD}MongoDB Atlas Configuration Steps:${NC}"
echo -e "${YELLOW}1. Login to MongoDB Atlas:${NC} https://cloud.mongodb.com"
echo -e "${YELLOW}2. Select your project and cluster${NC}"
echo -e "${YELLOW}3. Go to Network Access in the left sidebar${NC}"
echo -e "${YELLOW}4. Click '+ ADD IP ADDRESS' button${NC}"
echo -e "${YELLOW}5. Add the following IP addresses:${NC}"
echo -e "   • ${GREEN}Your current IP:${NC} ${PUBLIC_IP}"
echo -e "   • ${GREEN}AWS Elastic Beanstalk (IP range):${NC} 0.0.0.0/0 (temporarily for testing)"
echo -e "${YELLOW}6. Click 'Confirm' to save your changes${NC}"

echo -e "\n${BOLD}Testing Connections:${NC}"
echo -e "After configuring MongoDB Atlas, test the connections:"
echo -e "${BLUE}1. Test local connection:${NC}"
echo -e "   $ node check-atlas-access.js"
echo -e "${BLUE}2. Test AWS Elastic Beanstalk connection:${NC}"
echo -e "   $ curl -X GET https://${EB_ENV}/api/health"
echo -e "   This should return a response with mongoDBStatus: 'connected'"

echo -e "\n${BOLD}Mobile App Setup:${NC}"
echo -e "Once the backend is properly connected, your mobile app should work correctly"
echo -e "Make sure to rebuild and restart your React Native app after these changes"

echo -e "\n${BOLD}Long-term Security:${NC}"
echo -e "For production, you should set up VPC peering between AWS and MongoDB Atlas"
echo -e "See the ${BLUE}mongo-vpc-setup-guide.md${NC} file for detailed instructions"
echo -e "After VPC peering is configured, you can remove the 0.0.0.0/0 entry"

echo ""
echo -e "${GREEN}Script completed.${NC}" 