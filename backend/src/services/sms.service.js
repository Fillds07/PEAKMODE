const twilio = require('twilio');

/**
 * SMS service for sending text messages
 */
class SMSService {
  constructor() {
    this.setupClient();
  }

  setupClient() {
    try {
      // Check if Twilio credentials are set
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        // Create Twilio client
        this.client = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
        console.log('Twilio client initialized successfully');
        return true;
      } else {
        console.log('Twilio credentials not found in environment variables');
        // Use mock client for development
        this.useMockClient();
        return false;
      }
    } catch (error) {
      console.error('Error initializing Twilio client:', error);
      // Use mock client for development
      this.useMockClient();
      return false;
    }
  }

  // For development/testing without real Twilio credentials
  useMockClient() {
    console.log('Using mock SMS client for development');
    this.client = {
      messages: {
        create: async (options) => {
          console.log('MOCK SMS:', options);
          return {
            sid: 'MOCK_SID_' + Math.random().toString(36).substring(7),
            status: 'queued',
          };
        },
      },
    };
    this.fromNumber = '+15555555555'; // Mock number
  }

  /**
   * Send password reset SMS
   * @param {string} to - Recipient phone number with country code (e.g., +15551234567)
   * @param {string} username - User's username
   * @param {string} resetToken - Password reset token
   * @returns {Promise<Object>} - SMS send result
   */
  async sendPasswordResetSMS(to, username, resetToken) {
    try {
      // Format the phone number if needed (ensure it starts with +)
      const formattedPhone = to.startsWith('+') ? to : `+${to}`;
      
      // Create base URL for reset link
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL || 'https://app.peakmode.com' 
        : 'http://192.168.1.179:19000';
      
      const resetLink = `${baseUrl}/screens/ResetPasswordScreen?token=${resetToken}`;
      
      // Create message content
      const message = `PEAKMODE: Reset your password by visiting ${resetLink}. This link will expire in 10 minutes.`;
      
      // Send SMS
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: formattedPhone,
      });
      
      console.log(`Password reset SMS sent to ${to}, SID: ${result.sid}`);
      return {
        success: true,
        sid: result.sid,
        status: result.status,
      };
    } catch (error) {
      console.error('Error sending password reset SMS:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Export a singleton instance
module.exports = new SMSService(); 