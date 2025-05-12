# PEAKMODE App

PEAKMODE is an iOS app for energy management and wellness.

## Quick Setup Guide

### First Time Setup (Do Once)

Run these commands in order:

```bash
# 1. Initialize the project (checks requirements & creates scripts)
./init.sh

# 2. Install all dependencies 
./install.sh
```

### Running the App (Every Time)

Open two terminal windows:

```bash
# Terminal 1: Start the backend server
./run-backend.sh

# Terminal 2: Start the frontend (Expo) server
./run-frontend.sh
```

### Database Management

To view the contents of the SQLite database (tables and data):

```bash
# Print database contents from the root directory
./print-db.sh
```

This prints a formatted view of all database tables and their contents to the console.

## What's Included

- **Backend**: Express server with SQLite database
- **Frontend**: React Native app using Expo
- **Authentication**: JWT-based with security question password reset
- **Database**: Local SQLite (no external database needed)

## Project Structure

```
peakmode/
├── backend/         # Express server with SQLite database
├── frontend/        # React Native / Expo application
├── init.sh          # Project initialization script
├── install.sh       # Dependencies installation script
├── run-backend.sh   # Backend start script
├── run-frontend.sh  # Frontend start script
└── print-db.sh      # Database content viewer script
```

## Technical Notes

- Backend runs on port 5003
- Frontend uses Expo for iOS development
- Password reset uses security questions instead of email
- SQLite database is stored in `backend/data/peakmode.db`

## Troubleshooting

If you encounter issues:
- Check terminal output for specific error messages
- Make sure you've completed both initialization and installation steps
- Verify Node.js version (v14+ recommended)
- For iOS simulator issues, ensure Xcode is installed and updated 