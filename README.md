# PEAKMODE App
# By: Omar Waseem and Felipe Da Silva

PEAKMODE is an iOS app for energy management and wellness.

## Quick Setup Guide

### First Time Setup (Do Once)

Run these commands in order:

```bash
# 1. Initialize the project (checks requirements & creates scripts)
./init.sh

# 2. Configure network for remote access (required for physical devices)
./add-IP.sh

# 3. Install all dependencies 
./install.sh
```

The `add-IP.sh` script will:
1. Detect your local IP address automatically
2. Configure both frontend and backend to use this IP
3. Verify that all configuration files are properly set up
4. Provide clear instructions for next steps

This step is essential if you plan to test on physical devices or allow other developers to connect to your instance. The script works for both iOS and Android devices and is compatible with different operating systems.

### Running the App (Every Time)

Open two terminal windows:

```bash
# Terminal 1: Start the backend server
./run-backend.sh

# Terminal 2: Start the frontend (Expo) server
./run-frontend.sh
Type i on the keyboard for IOS. Website and Andriod app is in progress.
To access IOS, you will need to install Xcode to simulate an iphone app, or connect to your own iphone.
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
├── add-IP.sh        # Network configuration script for remote access
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
- For physical device connection issues:
  - Run `./add-IP.sh` to configure your network settings
  - Check the verification section output to confirm all files are correctly set up
  - Make sure your device is on the same WiFi network as your development computer
  - Use the Expo QR code to connect to your development server 
