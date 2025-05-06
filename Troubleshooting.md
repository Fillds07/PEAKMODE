# PEAKMODE App Troubleshooting Guide

## Server Issues

### "Address already in use" Error

**Problem:** When starting the backend server, you get: `Error: listen EADDRINUSE: address already in use 0.0.0.0:5002`

**Solution:** 
1. Find the process using port 5002: `lsof -i:5002`
2. Kill the process: `kill -9 [PID]` 
3. Or use the improved scripts that handle this automatically: `./start-backend.sh`

### Cannot find start scripts

**Problem:** When running `./start-backend.sh`, you get: `No such file or directory`

**Solution:**
1. Make sure you're in the correct directory: `cd /Users/fillds07/Documents/PEAKMODE`
2. Check if the scripts exist: `ls -la *.sh`
3. If they don't exist, create them again
4. Make them executable: `chmod +x *.sh`

## Email and SMS Issues

### Password Reset Not Working 

**Problem:** You're not receiving password reset emails or SMS

**Solution:**
1. In development mode, check the server console for:
   - Email preview links from Ethereal
   - Mock SMS logs
   
2. For production:
   - Set up your `.env` file with proper email and SMS credentials
   - Follow the setup guide in `EmailSMS-Setup.md`

### Seeing "If an account exists..." message

This is a security feature to not reveal if a username exists. For testing:

1. Use a valid username that exists in your database
2. Check the server console for successful email/SMS sending logs
3. In development mode, the token is returned in the API response for testing

## Frontend Connection Issues

### "Network request failed"

**Problem:** Frontend can't connect to backend

**Solution:**
1. Make sure backend server is running: `./start-backend.sh`
2. Verify your IP address in the `auth.service.js` file matches your computer's IP
3. Ensure your device is on the same network as your computer
4. Try using `http://localhost:5002` for testing in emulators

### Script Permission Issues

**Problem:** Cannot execute the scripts

**Solution:**
```bash
chmod +x start-backend.sh
chmod +x start-frontend.sh
chmod +x start-app.sh
```

## App Deployment

For a production setup:

1. Deploy backend to a service like Railway, Render, or AWS
2. Update the API endpoints in the app to point to your deployed backend
3. Set up real email and SMS credentials in your backend environment variables
4. Remove development-only code like token display alerts 