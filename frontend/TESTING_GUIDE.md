# Testing PEAKMODE on Different Devices

This guide explains how to run and test the PEAKMODE app on different devices, even across different networks.

## Prerequisites

Before testing, make sure you have all required components installed and running:

1. **MongoDB** - The database must be running
2. **Backend Server** - The Node.js API server must be running on port 5002
3. **Frontend** - The Expo/React Native app

## Quick Start Guide

The easiest way to start everything is to use our helper script:

```bash
# From the PEAKMODE root directory:
./start-local-all.sh
```

This script automatically:
- Starts MongoDB (if you have it installed via Homebrew)
- Starts the backend server
- Starts the frontend with the correct environment settings

## For Testing Across Networks (Important!)

To test with anyone outside your local network (colleagues, professors), use:

```bash
# From the PEAKMODE root directory:
cd frontend
./start-app.sh --tunnel --clear
```

This will:
- Use Expo's tunnel feature to allow connections from any network
- Clear the cache to avoid stale configuration issues
- Prompt you to start the backend if needed

## Manual Setup

If you need to start components individually:

### 1. Start MongoDB

If using Homebrew on macOS:
```bash
brew services start mongodb/brew/mongodb-community@7.0
```

On other systems, follow MongoDB's documentation for your OS.

### 2. Start the Backend Server

```bash
# From the PEAKMODE root directory:
./start-backend.sh

# OR manually:
cd backend
npm run dev
```

The backend server will start on port 5002. You can verify it's running by visiting http://localhost:5002/api/health in your browser.

### 3. Start the Frontend

```bash
# From the PEAKMODE root directory:
cd frontend
./start-app.sh
```

Our improved `start-app.sh` script will:
- Ask if you need tunnel mode for cross-network testing
- Check if the backend is running
- Offer to start it for you if needed
- Configure the correct IP address automatically

## Testing on Physical Devices

### For App Testers

1. Install the "Expo Go" app from your device's app store:
   - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)

2. When the developer shares a QR code with you, scan it with:
   - **Android**: Open Expo Go and scan the QR code
   - **iOS**: Use the Camera app to scan the QR code

3. The app will load directly on your device!

### On Your Local Network

To test with devices on your local network:

1. Make sure your phone is connected to the same WiFi as your computer
2. Run `./frontend/start-app.sh` on your development machine
3. Scan the QR code on your device
4. The app should connect to your local backend automatically

### Troubleshooting Connection Issues

If you see the "No internet connection" error even when you have internet:

1. Restart the app with cleared cache:
   ```bash
   ./start-app.sh --clear
   ```

2. If that doesn't work, use tunnel mode:
   ```bash
   ./start-app.sh --tunnel --clear
   ```

3. Update all dependencies:
   ```bash
   ./start-app.sh --update --tunnel --clear
   ```

4. Try completely restarting:
   - Stop all running instances of the app
   - Close Metro bundler (Ctrl+C)
   - Clear Expo cache: `npx expo start --clear`
   - Try tunnel mode again

### "Internet Connection" Error But Login Works

If you see a "No internet connection" message but login still works, this is normal. The app has been configured to allow login attempts even when it thinks there's no internet. The message is just informational.

## Testing Across Different Networks

For cross-network testing (someone at a different location):

1. The developer should run with tunnel mode:
   ```bash
   ./start-app.sh --tunnel
   ```

2. When the QR code appears, use one of these approaches:
   - Share a screenshot of the QR code with your testers
   - Share the Expo URL (beginning with `exp://`) that appears in the terminal

3. Testers should:
   - Scan the QR code or open the URL in Expo Go
   - If a connection error appears, press "Retry Connection"
   - Login should work even if "No internet connection" message appears

### How Tunnel Mode Works

Tunnel mode creates a secure connection between your local computer and Expo's servers. This allows anyone with the QR code to access your app, regardless of their network location. The tunnel forwards all app requests to your local development environment.

## Updating Dependencies

If you need to update the app's dependencies:

```bash
# From the frontend directory:
npm install
```

Or use our helper flag:
```bash
./start-app.sh --update
```

## Advanced Options

The start-app.sh script supports several flags:

- `--tunnel` - Enable tunnel mode for cross-network testing
- `--clear` - Clear Metro bundler cache
- `--update` - Update npm dependencies
- `--no-tunnel` - Explicitly disable tunnel mode

Example: `./start-app.sh --tunnel --clear --update`

## Common Issues & Solutions

### Missing Asset Files
If you see errors about missing asset files:
```
Error: ENOENT: no such file or directory, scandir '/path/to/assets/images'
```

Make sure:
1. All asset paths in your code reference the correct directory structure
2. You're running the frontend app from the `frontend` directory

### Backend Connection Failures
If your app can't connect to the backend:

1. Verify the backend is running: `http://localhost:5002/api/health`
2. Check that your API URL is correct in the app
3. Make sure MongoDB is running and the backend can connect to it

### Expo Errors
For Expo-related errors:

1. Try clearing cache: `npx expo start --clear`
2. Update dependencies: `./start-app.sh --update`
3. Check for TypeScript errors: `npm run lint` 