# PEAKMODE Email and SMS Setup Guide

This guide will help you set up real email and SMS functionality for your PEAKMODE application.

## Required Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```
# Server Configuration
PORT=5002
NODE_ENV=development

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here

# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/peakmode

# Frontend URL (for password reset links)
FRONTEND_URL=https://app.peakmode.com

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=PEAKMODE Support <your-email@gmail.com>

# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+15551234567
```

## Email Service Setup (Gmail)

1. **Create a Gmail account** or use an existing one for your application
2. **Enable 2-Step Verification** for your Gmail account:
   - Go to your Google Account → Security → 2-Step Verification → Turn on
3. **Generate an App Password**:
   - Go to your Google Account → Security → App passwords
   - Select "Mail" as the app and "Other" as the device
   - Enter "PEAKMODE" as the name
   - Copy the generated 16-character password
4. **Update your `.env` file**:
   ```
   EMAIL_SERVICE=gmail
   EMAIL_USERNAME=your-gmail-address@gmail.com
   EMAIL_PASSWORD=your-16-character-app-password
   EMAIL_FROM=PEAKMODE Support <your-gmail-address@gmail.com>
   ```

## SMS Service Setup (Twilio)

1. **Create a Twilio account** at [twilio.com](https://www.twilio.com/)
2. **Get a Twilio phone number**:
   - Navigate to Phone Numbers → Buy a Number
   - Ensure it has SMS capabilities
3. **Locate your Account SID and Auth Token**:
   - Find these on your Twilio Dashboard
4. **Update your `.env` file**:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1yourtwilinumber
   ```

## Alternative Email Services

If you prefer not to use Gmail, you can configure other providers:

### SendGrid
```
EMAIL_SERVICE=sendgrid
EMAIL_USERNAME=apikey
EMAIL_PASSWORD=your_sendgrid_api_key
```

### Mailgun
```
EMAIL_SERVICE=mailgun
EMAIL_USERNAME=your_mailgun_username
EMAIL_PASSWORD=your_mailgun_password
```

## Testing Your Configuration

After setting up your environment variables:

1. Restart your backend server
2. Try the password reset functionality
3. Check your Twilio console for SMS delivery status
4. Check your email's sent folder to confirm emails are being sent

## Production Considerations

For production environments:
- Use environment-specific variables (different email addresses for production vs. development)
- Consider email delivery rates and SMS costs
- Implement rate limiting for password reset requests
- Consider using dedicated email delivery services like SendGrid or Mailgun for better deliverability 