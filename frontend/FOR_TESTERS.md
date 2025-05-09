# PEAKMODE App - For Professors & Testers

## Quick Start (One Command Setup)

### macOS / Linux
To run the complete application with a single command that starts everything on Mac:

```bash
./start-simple.sh
```

### Windows
For Windows users, double-click on:
```
start-windows.bat
```

## What Happens Automatically

The script automatically:
1. Starts MongoDB database
2. Launches the backend server in a new terminal window
3. Installs the required tunneling dependency
4. Fixes any dependency conflicts
5. Updates package versions to their compatible versions
6. Starts the frontend with tunnel mode
7. Displays a QR code for testing from any network

## How to Test the App

1. Make sure you have the Expo Go app installed on your device:
   - [Expo Go for iOS](https://apps.apple.com/app/expo-go/id982107779)
   - [Expo Go for Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. When the QR code appears in the terminal:
   - On iOS: Scan with your Camera app
   - On Android: Open Expo Go and scan the QR code

3. The app will connect to the developer's machine automatically

## Important Notes

- You can test from any network (home, school, coffee shop)
- No need to be on the same Wi-Fi as the developer
- If you see "No internet connection" error, you can still proceed with login
- The tunnel creates a secure connection from your device to the developer's computer

## Credentials for Testing

Username: testuser
Password: testpassword

## Troubleshooting

If you have any issues connecting:

1. Try pressing "Retry Connection" on the error screen
2. Make sure Expo Go is up to date
3. Wait 10-15 seconds after scanning the QR code - initial connection can be slow
4. If you see "Node option errors", ignore them - these won't affect app functionality
5. If you see dependency or npm errors, run the script again
6. Contact the developer to verify the server is running

## For Remote Testing

If you're off-campus or on a different network:
1. The tunnel mode should work automatically
2. Make sure port 19000-19001 are not blocked by your firewall/network
3. If you can't connect, try using mobile data instead of Wi-Fi 