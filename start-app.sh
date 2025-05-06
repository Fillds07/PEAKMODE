#!/bin/bash

# Script to start both backend and frontend servers

# Set the base directory to the script location
BASE_DIR="$(dirname "$0")"

# Function to clean up processes when exiting
cleanup() {
    echo "Stopping all processes..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C (SIGINT) and call cleanup
trap cleanup SIGINT

# Check if there's already a process using backend port
PORT=5002
PID=$(lsof -ti:$PORT)
if [ ! -z "$PID" ]; then
  echo "Port $PORT is already in use by process $PID. Stopping it..."
  kill -9 $PID
  sleep 1
  echo "Process stopped."
fi

# Check if there's already an Expo process running
EXPO_PID=$(ps aux | grep "expo start" | grep -v grep | awk '{print $2}')
if [ ! -z "$EXPO_PID" ]; then
  echo "Expo is already running (PID: $EXPO_PID). Stopping it..."
  kill -9 $EXPO_PID
  sleep 1
  echo "Expo process stopped."
fi

# Start backend server
echo "Starting backend server..."
cd "$BASE_DIR/backend"
npm start &
BACKEND_PID=$!

# Wait a moment for backend to initialize
sleep 2

# Start frontend server
echo "Starting frontend server..."
cd "$BASE_DIR/frontend"
npx expo start &
FRONTEND_PID=$!

echo ""
echo "Both servers are running!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait 