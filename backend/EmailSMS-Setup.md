# Setting Up Email and SMS for Password Reset

This document explains how to configure email and SMS services for password reset functionality in the PEAKMODE app.

## Email Configuration

We use Nodemailer for sending emails. The app is configured to use peakmode.info@gmail.com as the sending address for password reset emails.

### Current Configuration (Production)

The application is currently set up with the following email configuration:

```
EMAIL_SERVICE=gmail
EMAIL_USERNAME=peakmode.info@gmail.com
EMAIL_FROM=peakmode.info@gmail.com
```

This Gmail account is used to send all password reset emails to users.

### Setting Up Gmail with App Password (Required)

Gmail requires you to set up an App Password for use with third-party applications like our email service. Here are the steps to set it up:

1. **Enable 2-Step Verification for your Gmail account**:
   - Go to https://myaccount.google.com/security
   - Sign in with the Gmail account you want to use (e.g., peakmode.info@gmail.com)
   - Find "2-Step Verification" and enable it
   - Follow the prompts to set up 2-Step Verification

2. **Generate an App Password**:
   - After enabling 2-Step Verification, go back to https://myaccount.google.com/security
   - Scroll down to find "App passwords" (or search for it in the search bar)
   - Select "App" as "Mail" and "Device" as "Other" (Custom name)
   - Enter a name like "PEAKMODE App" and click "Generate"
   - Google will display a 16-character app password - copy this password
   - Update your `.env` file with this app password:
   ```
   EMAIL_SERVICE=gmail
   EMAIL_USERNAME=peakmode.info@gmail.com
   EMAIL_PASSWORD=your-16-character-app-password
   EMAIL_FROM=peakmode.info@gmail.com
   ```

3. **Restart the server** after updating the `.env` file to apply the changes.

### For Using Your Own Gmail (Alternative)

1. Add these to your `.env` file:
```
EMAIL_USERNAME=your-gmail-address@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

2. For Gmail, you'll need to:
   - Enable 2-Step Verification on your Google account
   - Generate an App Password (Google Account → Security → App Passwords)
   - Use that app password in the `.env` file instead of your regular Gmail password

## Troubleshooting Gmail Authentication

If you encounter authentication issues with Gmail:

1. Verify that 2-Step Verification is enabled on your Gmail account
2. Ensure you're using an App Password, not your regular Gmail password
3. Make sure the app password has no spaces or typos
4. Check that you're using the correct Gmail address

## SMS Configuration with Twilio

1. Create a Twilio account at [twilio.com](https://www.twilio.com)
2. Get your Account SID and Auth Token from your Twilio Dashboard
3. Get a Twilio phone number
4. Add these to your `.env` file:
```
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

## Testing Without Credentials

The system is set up to work in development mode without actual credentials:

- For email: Uses Ethereal (fake SMTP service) to preview emails
- For SMS: Uses a mock service that logs messages to console

## Viewing Test Emails

When running in development mode without real email credentials, the system will:
1. Create a temporary email account on Ethereal
2. Send the email to that account
3. Log a preview URL in the console where you can view the email

Example console output:
```
Created test email account: example@ethereal.email
Password reset email sent: <message-id>
Preview URL: https://ethereal.email/message/...
```

## Verifying SMS Messages

When running without Twilio credentials, SMS messages will be logged to the console:

Example console output:
```
Using mock SMS client for development
MOCK SMS: { body: 'PEAKMODE: Your password reset code is: abc123...', from: '+15555555555', to: '+11234567890' }
```

## Common Issues and Fixes

### "Cannot read properties of undefined (reading 'sendMail')"

This error occurs when the email transporter is not properly initialized before being used. The EmailService has been updated to:

1. Properly handle async initialization in the constructor
2. Check for transporter availability before sending emails
3. Retry initialization if necessary when sending an email

If you're still experiencing this issue:
- Check backend logs for any errors during EmailService initialization
- Ensure your server has internet access (required for Ethereal test account creation)
- Try restarting the server to reinitialize the services

### Invalid Login / Gmail Authentication Errors

When using Gmail and you see an error like "Invalid login: 535-5.7.8 Username and Password not accepted":
- Make sure you've set up an App Password as described above
- Regular Gmail passwords will not work due to security restrictions
- Verify that you're using the correct email address and app password
- If issues persist, try generating a new app password

### SMS Service Working in Mock Mode

This is expected behavior when Twilio credentials are not found. To use real SMS:
- Ensure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER are in your .env file
- Verify the credentials are correct by checking Twilio logs
- For international numbers, ensure they're formatted with the country code (e.g., +1 for US) 