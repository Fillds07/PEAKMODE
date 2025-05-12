const bcrypt = require('bcrypt');
const { runQuery, getOne, getAll } = require('../models/database');

/**
 * Get user profile
 */
exports.getProfile = async (req, res) => {
  try {
    // Get userId from the authenticated user attached by middleware
    const userId = req.user.id;
    
    // Get complete user data directly from database
    const user = await getOne(
      'SELECT id, username, email, name, phone FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Get user's security question IDs (not answers)
    const securityQuestions = await getAll(`
      SELECT question_id FROM user_security_answers
      WHERE user_id = ?
    `, [userId]);
    
    const hasSecurityQuestions = securityQuestions.length > 0;
    
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          ...user,
          hasSecurityQuestions
        }
      }
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching profile'
    });
  }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, username } = req.body;
    
    console.log('Update profile request received:', {
      userId,
      requestBody: req.body,
      requestHeaders: req.headers,
      currentUser: req.user
    });
    
    // Basic validation
    if (!name && !email && !phone && !username) {
      console.log('No fields to update provided');
      return res.status(400).json({
        status: 'error',
        message: 'At least one field (name, email, phone, or username) is required'
      });
    }
    
    // Check if email is already in use (by another user)
    if (email) {
      const existingUser = await getOne(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );
      
      if (existingUser) {
        console.log('Email already in use:', email);
        return res.status(400).json({
          status: 'error',
          message: 'Email is already registered'
        });
      }
    }
    
    // Check if username is already in use (by another user)
    if (username) {
      const existingUser = await getOne(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, userId]
      );
      
      if (existingUser) {
        console.log('Username already taken:', username);
        return res.status(400).json({
          status: 'error',
          message: 'Username is already taken'
        });
      }
    }
    
    // Prepare update query based on provided fields
    let updateFields = [];
    const params = [];
    
    if (name) {
      updateFields.push('name = ?');
      params.push(name);
    }
    
    if (email) {
      updateFields.push('email = ?');
      params.push(email);
    }
    
    if (phone) {
      updateFields.push('phone = ?');
      params.push(phone);
    }
    
    if (username) {
      updateFields.push('username = ?');
      params.push(username);
    }
    
    // Only update if we have fields to update
    if (updateFields.length === 0) {
      console.log('No fields to update after validation');
      return res.status(400).json({
        status: 'error',
        message: 'No fields to update'
      });
    }
    
    // Create update query without timestamp
    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    params.push(userId);
    
    console.log('Updating user profile:', { 
      userId,
      updateFields, 
      params,
      query: updateQuery
    });
    
    // Update user
    await runQuery(updateQuery, params);
    
    // Get updated user
    const updatedUser = await getOne(
      'SELECT id, username, email, name, phone FROM users WHERE id = ?',
      [userId]
    );
    
    console.log('User profile updated successfully:', updatedUser);
    
    // If username was changed, update it in the token
    if (username) {
      // Set the new username in the user object so it's reflected in subsequent requests
      req.user.username = username;
      console.log('Updated username in request object:', req.user.username);
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating profile'
    });
  }
};

/**
 * Change password
 */
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    // Basic validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password and new password are required'
      });
    }
    
    // Get user with password
    const user = await getOne(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    try {
      // First try with timestamp
      await runQuery(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, userId]
      );
      console.log(`Password successfully changed for user ID: ${userId}`);
    } catch (dbError) {
      // If updated_at column doesn't exist, try without it
      console.log('Error updating with timestamp, trying without updated_at column');
      await runQuery(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, userId]
      );
      console.log(`Password successfully changed for user ID: ${userId} (without timestamp)`);
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while changing password'
    });
  }
};

/**
 * Delete user account
 */
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Delete user (cascade will delete security answers)
    await runQuery('DELETE FROM users WHERE id = ?', [userId]);
    
    res.status(200).json({
      status: 'success',
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while deleting account'
    });
  }
};

/**
 * Get user's security questions
 */
exports.getUserSecurityQuestions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get questions with question text but not answers
    const questions = await getAll(`
      SELECT sq.id, sq.question
      FROM security_questions sq
      JOIN user_security_answers usa ON sq.id = usa.question_id
      WHERE usa.user_id = ?
    `, [userId]);
    
    res.status(200).json({
      status: 'success',
      data: {
        questions
      }
    });
  } catch (error) {
    console.error('Error getting security questions:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching security questions'
    });
  }
};

/**
 * Update security questions
 */
exports.updateSecurityQuestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { answers } = req.body;
    
    // Basic validation
    if (!answers || !Array.isArray(answers) || answers.length < 3) {
      return res.status(400).json({
        status: 'error',
        message: 'At least 3 security answers are required'
      });
    }
    
    // Begin transaction
    await runQuery('BEGIN TRANSACTION');
    
    try {
      // Delete existing answers
      await runQuery('DELETE FROM user_security_answers WHERE user_id = ?', [userId]);
      
      // Insert new answers
      for (const answer of answers) {
        // Hash the answer for security
        const hashedAnswer = await bcrypt.hash(answer.answer.toLowerCase(), 10);
        
        await runQuery(
          'INSERT INTO user_security_answers (user_id, question_id, answer) VALUES (?, ?, ?)',
          [userId, answer.questionId, hashedAnswer]
        );
      }
      
      // Commit transaction
      await runQuery('COMMIT');
      
      res.status(200).json({
        status: 'success',
        message: 'Security questions updated successfully'
      });
    } catch (error) {
      // Rollback transaction on error
      await runQuery('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating security questions:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating security questions'
    });
  }
}; 