const bcrypt = require('bcrypt');
const { runQuery, getOne, getAll } = require('../models/database');

/**
 * Get user profile
 */
exports.getProfile = async (req, res) => {
  try {
    // User is already attached to request by auth middleware
    const user = req.user;
    
    // Get user's security question IDs (not answers)
    const securityQuestions = await getAll(`
      SELECT question_id FROM user_security_answers
      WHERE user_id = ?
    `, [user.id]);
    
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
    const { name, email } = req.body;
    
    // Basic validation
    if (!name && !email) {
      return res.status(400).json({
        status: 'error',
        message: 'At least one field (name or email) is required'
      });
    }
    
    // Check if email is already in use (by another user)
    if (email) {
      const existingUser = await getOne(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );
      
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Email is already registered'
        });
      }
    }
    
    // Prepare update query based on provided fields
    let updateQuery = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
    const params = [];
    
    if (name) {
      updateQuery += ', name = ?';
      params.push(name);
    }
    
    if (email) {
      updateQuery += ', email = ?';
      params.push(email);
    }
    
    updateQuery += ' WHERE id = ?';
    params.push(userId);
    
    // Update user
    await runQuery(updateQuery, params);
    
    // Get updated user
    const updatedUser = await getOne(
      'SELECT id, username, email, name FROM users WHERE id = ?',
      [userId]
    );
    
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
    await runQuery(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, userId]
    );
    
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