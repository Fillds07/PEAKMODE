/**
 * Authentication Controller
 * 
 * Handles user authentication processes including:
 * - User registration
 * - User login
 * - Password reset flow (forgot password & reset password)
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const mongoose = require('mongoose');

/**
 * Creates a JWT token for the given user ID
 * @param {string} id - User ID to include in the token
 * @returns {string} Signed JWT token
 */
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

/**
 * Creates a token, removes sensitive user data, and sends the response
 * @param {Object} user - User document from MongoDB
 * @param {number} statusCode - HTTP status code for the response
 * @param {Object} res - Express response object
 */
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove password from output for security
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

/**
 * Register a new user
 * @route POST /api/auth/signup
 * @access Public
 */
exports.signup = async (req, res, next) => {
  try {
    const { name, username, email, phone, password } = req.body;

    console.log('Signup attempt for:', { username, email, phone });

    // Verify MongoDB connection
    if (!isMongoDBConnected()) {
      return sendDatabaseConnectionError(res);
    }

    // Check for existing users
    const existingUserError = await checkExistingUser(email, username);
    if (existingUserError) {
      return res.status(existingUserError.status).json(existingUserError.response);
    }

    // Create new user
    try {
      console.log('Creating new user:', { name, username, email, phone });
      const newUser = await User.create({
        name,
        username,
        email,
        phone,
        password,
      });
      
      console.log('User created successfully:', newUser._id);
      createSendToken(newUser, 201, res);
    } catch (validationError) {
      handleValidationError(validationError, res);
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error creating user',
      details: { 
        type: 'server_error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
};

/**
 * Check if MongoDB is connected
 * @returns {boolean} True if connected
 */
const isMongoDBConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Send database connection error response
 * @param {Object} res - Express response object
 */
const sendDatabaseConnectionError = (res) => {
  console.error('MongoDB not connected - signup failed');
  return res.status(500).json({
    status: 'error',
    message: 'Database connection issue. Please try again later.',
  });
};

/**
 * Check if a user with the given email or username already exists
 * @param {string} email - Email to check
 * @param {string} username - Username to check
 * @returns {Object|null} Error object or null if no existing user
 */
const checkExistingUser = async (email, username) => {
  // Check if email already exists
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    console.log('Signup failed: Email already in use');
    return {
      status: 409,
      response: {
        status: 'error',
        message: 'Email already in use',
        details: {
          field: 'email',
          exists: true,
          id: existingEmail._id,
          createdAt: existingEmail.createdAt
        }
      }
    };
  }

  // Check if username already exists
  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    console.log('Signup failed: Username already in use');
    return {
      status: 409,
      response: {
        status: 'error',
        message: 'Username already in use',
        details: {
          field: 'username',
          exists: true,
          id: existingUsername._id,
          createdAt: existingUsername.createdAt
        }
      }
    };
  }

  return null;
};

/**
 * Handle validation errors during user creation
 * @param {Error} validationError - Error object from Mongoose validation
 * @param {Object} res - Express response object
 * @returns {Object} Response with error details
 */
const handleValidationError = (validationError, res) => {
  // Handle mongoose validation errors
  if (validationError.name === 'ValidationError') {
    const messages = Object.values(validationError.errors).map(err => err.message);
    console.log('Validation error during signup:', messages[0]);
    return res.status(400).json({
      status: 'error',
      message: messages[0], // Return the first validation error
      details: {
        type: 'validation',
        errors: messages
      }
    });
  }
  
  // Handle MongoDB duplicate key errors
  if (validationError.code === 11000) {
    const field = Object.keys(validationError.keyPattern)[0];
    console.log(`Duplicate key error: ${field} already exists`);
    return res.status(409).json({
      status: 'error',
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already in use`,
      details: {
        field: field,
        exists: true,
        value: validationError.keyValue[field]
      }
    });
  }
  
  console.error('Error creating user:', validationError);
  throw validationError; // Re-throw if it's not a validation error
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Check if username and password exist
    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide username and password',
      });
    }

    // Check if user exists && password is correct
    const user = await User.findOne({ username }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect username or password',
      });
    }

    // If everything ok, send token to client
    createSendToken(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error logging in',
    });
  }
};

/**
 * Send password reset token to user's email
 * @route POST /api/auth/forgotPassword
 * @access Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    // Import the email service
    const emailService = require('../services/email.service');
    
    const { username, email } = req.body;
    
    // Validate we have at least one identifier
    if (!username && !email) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide username or email to reset your password',
      });
    }
    
    // Find user by provided identifier
    const { user, identifierType } = await findUserByIdentifier(username, email);
    
    console.log(`Password reset request by ${identifierType}: ${username || email}`);
    
    // For security, don't reveal if user exists or not
    if (!user) {
      return sendPasswordResetResponse(res, identifierType, false);
    }

    // Generate reset token and save to user record
    const resetToken = await generateAndSaveResetToken(user);

    // Send reset token via email
    const emailSent = await sendPasswordResetTokenEmail(user, resetToken, emailService);
    
    // Return appropriate response
    return sendPasswordResetResponse(res, identifierType, emailSent);
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error processing password reset',
    });
  }
};

/**
 * Find a user by username or email
 * @param {string} username - Username to search for
 * @param {string} email - Email to search for
 * @returns {Object} User object and identifierType
 */
const findUserByIdentifier = async (username, email) => {
  let user = null;
  let identifierType = '';
  
  if (username) {
    user = await User.findOne({ username });
    identifierType = 'username';
  } else if (email) {
    user = await User.findOne({ email });
    identifierType = 'email';
  }
  
  return { user, identifierType };
};

/**
 * Generate a reset token and save it to the user record
 * @param {Object} user - User document from MongoDB
 * @returns {string} Plain text reset token (before hashing)
 */
const generateAndSaveResetToken = async (user) => {
  // Generate the random reset token - we'll use a shorter, more user-friendly token
  // that can be easily typed into a mobile app (8 characters)
  const resetToken = crypto.randomBytes(4).toString('hex'); // 8 characters

  // Store the hashed version of the token in the database for security
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  await user.save({ validateBeforeSave: false });
  
  return resetToken;
};

/**
 * Send reset token email to the user
 * @param {Object} user - User document from MongoDB
 * @param {string} resetToken - Plain text reset token
 * @param {Object} emailService - Email service instance
 * @returns {boolean} True if email was sent successfully
 */
const sendPasswordResetTokenEmail = async (user, resetToken, emailService) => {
  let emailSent = false;

  // Send via email if available
  if (user.email) {
    emailSent = await emailService.sendPasswordResetEmail(
      user.email,
      user.username,
      resetToken // Send the plain token to the user via email
    );
    console.log(`Email sent status: ${emailSent}`);
  }
  
  return emailSent;
};

/**
 * Send appropriate response for password reset request
 * @param {Object} res - Express response object
 * @param {string} identifierType - Type of identifier used (username or email)
 * @param {boolean} emailSent - Whether email was successfully sent
 * @returns {Object} Response object
 */
const sendPasswordResetResponse = (res, identifierType, emailSent) => {
  if (emailSent) {
    return res.status(200).json({
      status: 'success',
      message: 'Password reset token has been sent to your email. Please check both your inbox and spam folder.',
      emailSent,
    });
  } else {
    // For security, don't reveal that the user exists if we couldn't send a message
    return res.status(200).json({
      status: 'success',
      message: `If an account with that ${identifierType} exists, a password reset token has been sent to your email. Please check your inbox and spam folder.`,
    });
  }
};

/**
 * Reset password with token
 * @route PATCH /api/auth/resetPassword
 * @access Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    
    console.log(`Reset password attempt with token: ${token}`);
    
    // Validate input
    if (!token || !password) {
      console.log('Missing token or password in reset request');
      return res.status(400).json({
        status: 'error',
        message: 'Please provide both token and new password',
      });
    }

    // Find user with valid reset token
    const user = await findUserByResetToken(token);

    // If token has expired or is invalid
    if (!user) {
      console.log('Invalid or expired token - no matching user found');
      return res.status(400).json({
        status: 'error',
        message: 'Reset token is invalid or has expired. Please request a new password reset token.',
      });
    }

    console.log(`Valid token for user: ${user.username}`);

    // Update password and clear reset token
    await updateUserPassword(user, password);

    // Log the user in, send JWT
    createSendToken(user, 200, res);
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error resetting password',
    });
  }
};

/**
 * Find a user by their reset token
 * @param {string} token - Plain text reset token
 * @returns {Object|null} User document or null if not found
 */
const findUserByResetToken = async (token) => {
  // Hash the token from the request to compare with the stored hash
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  console.log(`Looking for user with token hash: ${hashedToken}`);
  
  // Find user with the hashed token that hasn't expired
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  
  if (user) {
    console.log(`Found user with matching token: ${user.username || user.email}`);
    console.log(`Token expires: ${new Date(user.resetPasswordExpire)}`);
  } else {
    console.log('No user found with matching token or token has expired');
  }
  
  return user;
};

/**
 * Update user's password and clear reset token fields
 * @param {Object} user - User document from MongoDB
 * @param {string} password - New password
 * @returns {Promise} Promise representing save operation
 */
const updateUserPassword = async (user, password) => {
  // Set the new password and clear the reset token fields
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  return await user.save();
}; 