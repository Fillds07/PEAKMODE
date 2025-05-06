/**
 * Email Service
 * 
 * Provides functionality for sending transactional emails from the application,
 * particularly for authentication-related features like password reset.
 * 
 * This service uses Gmail to send real emails for password reset functionality.
 */
const nodemailer = require('nodemailer');

class EmailService {
  /**
   * Initialize the email service
   */
  constructor() {
    console.log("Initializing EmailService...");
    this.transporter = null;
    this.fromEmail = null;
    
    // Use real emails for both development and production
    this.useRealEmails = true;
    
    // Initialize transporter immediately
    this.init();
  }
  
  /**
   * Initialize the email service by setting up the appropriate transporter
   */
  async init() {
    try {
      await this.setupTransporter();
    } catch (err) {
      console.error("Error initializing EmailService:", err);
    }
  }

  /**
   * Set up the appropriate email transporter
   * @returns {Promise<boolean>} - True if setup was successful
   */
  async setupTransporter() {
    if (this.useRealEmails) {
      return await this.setupGmailTransporter();
    } else {
      console.log('Development environment detected - using Ethereal test email account');
      return await this.setupDevelopmentTransporter();
    }
  }

  /**
   * Set up Gmail transporter using environment variables or hardcoded values
   * @returns {Promise<boolean>} - True if setup was successful
   */
  async setupGmailTransporter() {
    console.log("Setting up Gmail transporter for PEAKMODE");
    
    // PEAKMODE email credentials
    const emailUsername = process.env.EMAIL_USERNAME || 'peakmode.info@gmail.com';
    const emailPassword = process.env.EMAIL_PASSWORD || 'rsrf vdat mhgc wmql';
    
    // Create a real email transporter using Gmail
    try {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // Use SSL
        auth: {
          user: emailUsername,
          pass: emailPassword,
        },
      });
      
      this.fromEmail = emailUsername;
      console.log(`Email service initialized with Gmail`);
      console.log(`Using email address: ${this.fromEmail}`);
      
      // Verify the connection configuration
      await this.transporter.verify();
      console.log("SMTP connection to Gmail verified successfully");
      return true;
    } catch (error) {
      console.error("Failed to setup or verify Gmail connection:", error);
      console.error("Gmail app password may be incorrect or not set up properly");
      console.log("Falling back to Ethereal test account");
      this.useRealEmails = false;
      return await this.setupDevelopmentTransporter();
    }
  }

  /**
   * Set up development email transporter using Ethereal
   * @returns {Promise<boolean>} - True if setup was successful
   */
  async setupDevelopmentTransporter() {
    try {
      // Create a test account at ethereal.email
      const testAccount = await nodemailer.createTestAccount();
      console.log('===== ETHEREAL TEST EMAIL ACCOUNT =====');
      console.log('Created test email account:', testAccount.user);
      console.log('Password for viewing emails:', testAccount.pass);
      console.log('View sent emails at: https://ethereal.email');
      console.log('Login with the credentials above to see sent emails');
      console.log('======================================');
      
      // Create a reusable transporter using the test account
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      
      this.fromEmail = testAccount.user;
      console.log('Development email transporter initialized with Ethereal');
      return true;
    } catch (error) {
      console.error('Error creating test email account:', error);
      return false;
    }
  }

  /**
   * Ensures the email transporter is ready before sending
   * @returns {Promise<boolean>} - True if transporter is ready or was initialized
   */
  async ensureTransporterReady() {
    if (!this.transporter) {
      console.log('Transporter not ready, initializing now...');
      return await this.setupTransporter();
    }
    return true;
  }
  
  /**
   * Create password reset email content
   * @param {string} username - User's username
   * @param {string} resetToken - Password reset token
   * @returns {Object} - Email content including text and HTML versions
   */
  createPasswordResetEmailContent(username, resetToken) {
    // Use an inline base64 encoded image instead of fetching from an external URL
    const peakmodeLogoBase64 = 'data:image/png;base64,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';
      
    // Plain text version
    const text = `Hello ${username},

You requested a password reset for your PEAKMODE account.

Your password reset token is: ${resetToken}

Enter this token in the PEAKMODE app to reset your password.

This token will expire in 10 minutes.

If you didn't request this, please ignore this email.

Thanks,
The PEAKMODE Team`;

    // HTML version
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #F5B431; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">PEAKMODE</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${peakmodeLogoBase64}" alt="PEAKMODE Logo" style="max-width: 200px; height: auto;"/>
          </div>
          <p>Hello <strong>${username}</strong>,</p>
          <p>You requested a password reset for your PEAKMODE account.</p>
          <p>Your password reset token is:</p>
          <div style="text-align: center; margin: 25px 0;">
            <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 18px; letter-spacing: 2px; font-weight: bold;">
              ${resetToken}
            </div>
          </div>
          <p>Enter this token in the PEAKMODE app to reset your password.</p>
          <p>This token will expire in <strong>10 minutes</strong>.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Thanks,<br>The PEAKMODE Team</p>
        </div>
      </div>
    `;

    return { text, html };
  }

  /**
   * Send a password reset email
   * @param {string} to - Recipient email
   * @param {string} username - User's username
   * @param {string} resetToken - Password reset token
   * @returns {Promise<boolean>} - True if email sent successfully
   */
  async sendPasswordResetEmail(to, username, resetToken) {
    try {
      // Ensure transporter is ready
      const isReady = await this.ensureTransporterReady();
      if (!isReady) {
        console.error('Failed to initialize email transporter');
        return false;
      }
      
      // Log the email details for debugging
      console.log(`--------------------------------------------------`);
      console.log(`SENDING PASSWORD RESET EMAIL`);
      console.log(`To: ${to}`);
      console.log(`Username: ${username}`);
      console.log(`Reset Token: ${resetToken}`);
      console.log(`--------------------------------------------------`);
      
      // Create email content
      const emailContent = this.createPasswordResetEmailContent(username, resetToken);
      
      // Set up email options with token instead of link
      const mailOptions = {
        from: `"PEAKMODE Support" <${this.fromEmail}>`,
        to,
        subject: 'Reset Your PEAKMODE Password',
        text: emailContent.text,
        html: emailContent.html
      };
      
      // Send email
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent:', info.messageId);
      
      // For Ethereal test accounts, always show the preview URL
      if (!this.useRealEmails) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log('================================================');
        console.log('EMAIL PREVIEW URL (for viewing the sent email):');
        console.log(previewUrl);
        console.log('Copy and paste this URL in your browser to see the email that was sent');
        console.log('================================================');
      }
      
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }
}

// Singleton instance - using a different pattern to ensure initialization completes
const emailService = new EmailService();
module.exports = emailService; 