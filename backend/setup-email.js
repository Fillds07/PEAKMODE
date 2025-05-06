/**
 * Email Setup Utility
 * 
 * This script helps configure the Gmail app password for the PEAKMODE application.
 * Run this script once to save your app password securely.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt for Gmail APP Password
console.log('====== PEAKMODE Email Configuration ======');
console.log('');
console.log('This utility will help you set up the Gmail account for password reset emails');
console.log('');
console.log('IMPORTANT: You need to create an App Password for the PEAKMODE Gmail account');
console.log('1. Sign in to peakmode.info@gmail.com');
console.log('2. Go to Google Account Security settings');
console.log('3. Enable 2-Step Verification if not already enabled');
console.log('4. Create an App Password (select "Other" and name it "PEAKMODE")');
console.log('5. Copy the 16-character password provided by Google');
console.log('');

rl.question('Enter the Gmail App Password: ', (password) => {
  // Validate the app password format (typically 16 characters without spaces)
  const cleanPassword = password.replace(/\s/g, '');
  
  if (cleanPassword.length !== 16) {
    console.error('Error: Gmail App Passwords are typically 16 characters. Please double-check.');
    rl.close();
    return;
  }
  
  // Update the email service with the new password
  try {
    const emailServicePath = path.join(__dirname, 'src', 'services', 'email.service.js');
    let serviceContent = fs.readFileSync(emailServicePath, 'utf8');
    
    // Replace the placeholder with the actual password
    serviceContent = serviceContent.replace(
      /const emailPassword = process\.env\.EMAIL_PASSWORD \|\| ['"]YOUR_GMAIL_APP_PASSWORD_HERE['"];/,
      `const emailPassword = process.env.EMAIL_PASSWORD || '${cleanPassword}';`
    );
    
    fs.writeFileSync(emailServicePath, serviceContent);
    
    console.log('');
    console.log('✅ Email configuration updated successfully!');
    console.log('');
    console.log('The password reset functionality will now send real emails to users.');
    console.log('');
    console.log('To test the setup, run:');
    console.log('  node test-email.js');
    console.log('');
    console.log('Remember to restart your backend server to apply the changes.');
  } catch (error) {
    console.error('Error updating email configuration:', error);
  }
  
  rl.close();
}); 