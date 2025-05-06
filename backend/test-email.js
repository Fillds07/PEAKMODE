/**
 * Email Service Test
 * 
 * This script tests the email service functionality by sending a test email
 * to the specified email address using the configured Gmail account.
 */

// Load environment variables from .env file if available
try {
  require('dotenv').config();
} catch (error) {
  console.log('No .env file found, using default configuration');
}

// Import the email service
const emailService = require('./src/services/email.service');

// Set a test email address to receive the reset token
// You can change this to your own email for testing
const testEmail = process.argv[2] || 'fill.ds07@gmail.com';

// Define test user data
const testUser = {
  username: 'testuser',
  email: testEmail
};

// Generate a fake reset token
const resetToken = Math.random().toString(36).substring(2, 10);

console.log('=== PEAKMODE Email Service Test ===');
console.log('Sending test password reset email to:', testUser.email);
console.log('Username:', testUser.username);
console.log('Reset token:', resetToken);

// Send the test email
async function sendTestEmail() {
  try {
    // Send a test email
    console.log('Attempting to send password reset email...');
    const result = await emailService.sendPasswordResetEmail(
      testUser.email,
      testUser.username,
      resetToken
    );
    
    if (result) {
      console.log('===================================');
      console.log('✅ Email sent successfully!');
      console.log('Check your inbox (and spam folder) at:', testEmail);
      console.log('The email was sent from: peakmode.info@gmail.com');
      console.log('===================================');
    } else {
      console.log('❌ Email sending failed. Check the console for error details.');
    }
  } catch (error) {
    console.error('Error sending test email:', error);
  }
}

// Execute the test
sendTestEmail(); 