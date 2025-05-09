@echo off
setlocal enabledelayedexpansion

echo === PEAKMODE Simple Launcher (Windows) ===
echo Starting MongoDB, Backend, and Frontend
echo ===================================

REM Check if MongoDB is running
echo Checking MongoDB status...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe" >NUL
if "%ERRORLEVEL%"=="0" (
    echo MongoDB is already running
) else (
    echo Starting MongoDB...
    start /B mongodb\bin\mongod.exe --dbpath mongodb\data
    timeout /t 5 /nobreak >NUL
    echo MongoDB started
)

REM Start the backend server in a new window
echo Starting backend server in a new window...
start "PEAKMODE Backend" cmd /k "cd %~dp0backend && npm run dev"
timeout /t 3 /nobreak >NUL
echo Backend server started in a new window

REM Navigate to frontend directory and install dependencies
echo Setting up frontend...
cd frontend

REM Create .env file for Expo tunnel - FIXED to remove incorrect Node option
echo Creating environment file for tunneling...
echo EXPO_TUNNEL=1> .env

REM Get IP address for API URL
echo Getting local IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP_ADDRESS=%%a
    set IP_ADDRESS=!IP_ADDRESS:~1!
    goto :got_ip
)
:got_ip

if "!IP_ADDRESS!"=="" (
    echo Could not determine IP address. Using localhost.
    set IP_ADDRESS=localhost
)

echo IP Address: !IP_ADDRESS!

REM Install dependencies with fixed versions
echo Installing dependencies...
call npm install @expo/ngrok@^4.1.0 --save --legacy-peer-deps
call npm install --legacy-peer-deps

REM Start Expo with tunnel mode
echo Starting frontend with tunnel mode...
echo This may take a moment to start...
echo =======================================================
echo Connecting to: !IP_ADDRESS!:5002
echo When the QR code appears:
echo - Share it with testers or your professor
echo - They can scan it from any network to access the app
echo =======================================================

set EXPO_PUBLIC_API_HOST=!IP_ADDRESS!
set EXPO_TUNNEL=1
npx expo start --clear

endlocal 