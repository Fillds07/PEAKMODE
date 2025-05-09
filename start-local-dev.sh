#!/bin/bash

# Stop running process on port 5002 if any
PORT=5002
PID=$(lsof -ti:$PORT)
if [ ! -z "$PID" ]; then
  echo "Port $PORT is already in use by process $PID. Stopping it..."
  kill -9 $PID
  sleep 1
  echo "Process stopped."
fi

# Check if MongoDB is running, start if not
if ! brew services list | grep mongodb-community@7.0 | grep started > /dev/null; then
  echo "Starting MongoDB locally..."
  brew services start mongodb/brew/mongodb-community@7.0
  sleep 2
else
  echo "MongoDB is already running."
fi

# Navigate to backend directory and run the server
echo "Starting backend server with local MongoDB..."
cd "$(dirname "$0")/backend"
NODE_ENV=development npm run dev

# To stop MongoDB:
# brew services stop mongodb/brew/mongodb-community@7.0 