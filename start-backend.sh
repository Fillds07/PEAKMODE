#!/bin/bash

# Go to the backend directory and start the server
cd "$(dirname "$0")/backend"
echo "Starting backend server..."

# Check if there's already a process using port 5002
PORT=5002
PID=$(lsof -ti:$PORT)
if [ ! -z "$PID" ]; then
  echo "Port $PORT is already in use by process $PID. Stopping it..."
  kill -9 $PID
  sleep 1
  echo "Process stopped."
fi

# Start the server
npm start 