#!/bin/bash

# Go to the frontend directory and start the server
cd "$(dirname "$0")/frontend"
echo "Starting frontend server..."

# Check if there's already an Expo process running
EXPO_PID=$(ps aux | grep "expo start" | grep -v grep | awk '{print $2}')
if [ ! -z "$EXPO_PID" ]; then
  echo "Expo is already running (PID: $EXPO_PID). Stopping it..."
  kill -9 $EXPO_PID
  sleep 1
  echo "Expo process stopped."
fi

# Start expo
npx expo start 