#!/bin/bash

# Colors for better visibility
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== PEAKMODE - All Components in One Terminal ===${NC}"

# Start MongoDB if not already running
if ! brew services list | grep mongodb-community@7.0 | grep started > /dev/null; then
  echo -e "${BLUE}Starting MongoDB locally...${NC}"
  brew services start mongodb/brew/mongodb-community@7.0 > /dev/null
  sleep 2
  echo -e "${GREEN}✓ MongoDB started${NC}"
else
  echo -e "${GREEN}✓ MongoDB is already running${NC}"
fi

echo -e "${BLUE}Starting backend and frontend...${NC}"
echo -e "${GREEN}Press Ctrl+C to stop all services${NC}"
echo ""

# Use concurrently to run both services in the same terminal
npx concurrently \
  --kill-others \
  --prefix "[{name}]" \
  --names "BACKEND,FRONTEND" \
  --prefix-colors "cyan.bold,green.bold" \
  "cd backend && npm run dev" \
  "cd frontend && npm start" 