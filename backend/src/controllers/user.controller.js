/**
 * User Controller
 * 
 * Handles user profile operations including:
 * - Retrieving user profile
 * - Updating user profile
 * - Changing password
 * - Uploading avatar
 */
const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * Get current user profile
 * @route GET /api/users/profile
 * @access Private
 */
exports.getCurrentProfile = async (req, res) => {
  try {
    // User is already available from auth middleware
    const user = req.user;
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error retrieving user profile'
    });
  }
};

/**
 * Update user profile
 * @route PATCH /api/users/profile
 * @access Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, avatar } = req.body;
    const userId = req.user.id;

    // Filter out undefined fields
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (avatar) updateData.avatar = avatar;

    // Prevent updating sensitive fields like password or role
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { 
        new: true, // Return updated user
        runValidators: true // Run model validators
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors
      });
    }
    
    // Handle duplicate key errors (like email already in use)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        status: 'error',
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} is already in use`
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error updating user profile'
    });
  }
};

/**
 * Change user password
 * @route PATCH /api/users/change-password
 * @access Private
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Check if passwords are provided
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide current password and new password'
      });
    }

    // Get user with password
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check if current password is correct
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Update the password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error changing password'
    });
  }
};

/**
 * Delete user account
 * @route DELETE /api/users/profile
 * @access Private
 */
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Simply delete the user
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Account successfully deleted'
    });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error deleting user account'
    });
  }
}; 