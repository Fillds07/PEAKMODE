const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const User = require('../models/User');

// Authentication routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword', authController.resetPassword);

// Health check for auth routes
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Auth API is healthy' });
});

// Debug route to check if username or email exists
router.get('/check-account/:username/:email', async (req, res) => {
  try {
    const { username, email } = req.params;
    console.log(`Checking if account exists: username=${username}, email=${email}`);
    
    const existingUsername = await User.findOne({ username });
    const existingEmail = await User.findOne({ email });
    
    res.status(200).json({
      usernameExists: !!existingUsername,
      emailExists: !!existingEmail,
      usernameDetails: existingUsername ? {
        id: existingUsername._id,
        createdAt: existingUsername.createdAt
      } : null,
      emailDetails: existingEmail ? {
        id: existingEmail._id,
        createdAt: existingEmail.createdAt
      } : null
    });
  } catch (error) {
    console.error('Error checking account:', error);
    res.status(500).json({ 
      error: 'Server error checking account existence',
      message: error.message 
    });
  }
});

module.exports = router; 