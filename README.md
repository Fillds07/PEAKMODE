# PEAKMODE Application

PEAKMODE is a mobile application designed to help users reach their peak performance by providing energy management, supplement tracking, and personalized wellness recommendations.

## Project Structure

This project follows a modern microservices architecture with separate frontend and backend codebases:

```
PEAKMODE/
├── frontend/     # React Native (Expo) mobile application
├── backend/      # Node.js/Express API server
└── README.md     # This file
```

## Quick Start

From the project root, you can run both frontend and backend together:

```bash
# Install all dependencies (root, frontend, and backend)
npm run install:all

# Start both frontend and backend
npm run dev
```

This will start the backend server on port 5000 and launch the Expo development server for the frontend.

## For Testers & Graders

### One-Command Setup for Testing

To run the complete app stack (MongoDB, backend, and frontend) with a single command:

```bash
./start-all.sh
```

This will:
1. Start MongoDB database
2. Launch the backend server
3. Start the frontend with tunnel mode enabled
4. Show a QR code that can be scanned from any device on any network

Simply scan the QR code with the Expo Go app (iOS/Android) to start testing.

## Development Setup

### Frontend (Expo App)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

### Backend (Express API)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create a .env file with required environment variables
# (See backend/README.md for details)

# Start the development server
npm run dev
```

## Running Individual Parts

The root package.json provides these commands:

- `npm run frontend` - Run only the frontend (Expo app)
- `npm run backend` - Run only the backend server
- `npm run dev` - Run both simultaneously 
- `npm run install:all` - Install all dependencies
- `npm run install:frontend` - Install only frontend dependencies
- `npm run install:backend` - Install only backend dependencies

## API Documentation

The backend API provides authentication and data services for the frontend. For detailed API documentation, see [backend/README.md](backend/README.md).

## License

[MIT](LICENSE)
