#!/bin/bash

echo "Starting backend with ngrok tunnel..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "ngrok is not installed. Please install ngrok first."
    echo "Visit https://ngrok.com/download for installation instructions."
    exit 1
fi

# Start backend in the background
cd backend
npm start &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Determine the port from package.json or use default 3000
BACKEND_PORT=$(grep -o '"port":[^,]*' package.json | sed 's/"port": *//' || echo 3000)

# Start ngrok tunnel
echo "Starting ngrok tunnel on port $BACKEND_PORT..."
ngrok http $BACKEND_PORT

# When ngrok is closed, kill the backend process
kill $BACKEND_PID

cd .. 