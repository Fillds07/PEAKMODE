const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { runQuery, getAll, getOne } = require('../models/database');

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'peakmode-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Temporary store for password reset sessions
// In a production app, this would be in Redis or another database
const resetSessions = new Map();

/**
 * User signup controller
 */
exports.signup = async (req, res) => {
  try {
    const { username, email, password, name, phone } = req.body;
    
    // Basic validation
    if (!username || !email || !password || !name || !phone) {
      return res.status(400).json({
        status: 'error',
        message: 'All fields are required (username, email, password, name, phone)'
      });
    }
    
    // Check if username or email already exists
    const existingUser = await getOne(
      'SELECT username, email FROM users WHERE username = ? OR email = ?', 
      [username, email]
    );
    
    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({
          status: 'error',
          message: 'Username is already taken'
        });
      }
      
      if (existingUser.email === email) {
        return res.status(400).json({
          status: 'error',
          message: 'Email is already registered'
        });
      }
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const result = await runQuery(
      'INSERT INTO users (username, email, name, phone, password) VALUES (?, ?, ?, ?, ?)',
      [username, email, name, phone, hashedPassword]
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { id: result.lastID, username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: result.lastID,
          username,
          email,
          name
        },
        token
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during registration'
    });
  }
};

/**
 * User login controller
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Basic validation
    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username and password are required'
      });
    }
    
    // Find user by username
    const user = await getOne(
      'SELECT id, username, email, name, password FROM users WHERE username = ?',
      [username]
    );
    
    // If user not found or password doesn't match
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password'
      });
    }
    
    // Remove password from response
    const { password: userPassword, ...userData } = user;
    
    // No longer generating JWT token - just return user data
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during login'
    });
  }
};

/**
 * Get all security questions
 */
exports.getSecurityQuestions = async (req, res) => {
  try {
    const questions = await getAll('SELECT id, question FROM security_questions');
    
    res.status(200).json({
      status: 'success',
      data: {
        questions
      }
    });
  } catch (error) {
    console.error('Error fetching security questions:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching security questions'
    });
  }
};

/**
 * Save user security answers (during registration or profile update)
 */
exports.saveUserSecurityAnswers = async (req, res) => {
  try {
    const { userId, answers } = req.body;
    
    // Basic validation
    if (!userId || !answers || !Array.isArray(answers) || answers.length < 3) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID and at least 3 security answers are required'
      });
    }
    
    // Verify user exists
    const user = await getOne('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Begin transaction
    await runQuery('BEGIN TRANSACTION');
    
    try {
      // Clear existing answers
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
        message: 'Security answers saved successfully'
      });
    } catch (error) {
      // Rollback transaction on error
      await runQuery('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error saving security answers:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while saving security answers'
    });
  }
};

/**
 * Find username by email
 */
exports.findUsername = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Basic validation
    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required'
      });
    }
    
    // Find user by email
    const user = await getOne('SELECT username FROM users WHERE email = ?', [email]);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'No account found with this email'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        username: user.username
      }
    });
  } catch (error) {
    console.error('Error finding username:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while retrieving username'
    });
  }
};

/**
 * Get user's security questions
 */
exports.getUserSecurityQuestions = async (req, res) => {
  try {
    const { username } = req.body;
    
    // Basic validation
    if (!username) {
      return res.status(400).json({
        status: 'error',
        message: 'Username is required'
      });
    }
    
    // Find user
    const user = await getOne('SELECT id FROM users WHERE username = ?', [username]);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Get user's security questions
    const questions = await getAll(`
      SELECT sq.id, sq.question 
      FROM security_questions sq
      JOIN user_security_answers usa ON sq.id = usa.question_id
      WHERE usa.user_id = ?
      ORDER BY sq.id
    `, [user.id]);
    
    if (!questions || questions.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No security questions found for this user'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        questions: questions.map(q => ({
          id: q.id,
          question: q.question
        }))
      }
    });
  } catch (error) {
    console.error('Error getting user security questions:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while retrieving security questions'
    });
  }
};

/**
 * Verify user's security question answers
 */
exports.verifySecurityAnswers = async (req, res) => {
  try {
    const { username, answers } = req.body;
    
    // Basic validation
    if (!username || !answers || !Array.isArray(answers)) {
      return res.status(400).json({
        status: 'error',
        message: 'Username and answers are required'
      });
    }
    
    // Find user
    const user = await getOne('SELECT id FROM users WHERE username = ?', [username]);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Verify each answer
    let correctAnswers = 0;
    for (const answer of answers) {
      // Get stored hash for this question
      const storedAnswer = await getOne(
        'SELECT answer FROM user_security_answers WHERE user_id = ? AND question_id = ?',
        [user.id, answer.questionId]
      );
      
      if (storedAnswer) {
        // Compare answer (case-insensitive)
        const isCorrect = await bcrypt.compare(answer.answer.toLowerCase(), storedAnswer.answer);
        if (isCorrect) {
          correctAnswers++;
        }
      }
    }
    
    // Require all answers to be correct
    if (correctAnswers !== answers.length) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect security answers'
      });
    }
    
    // Generate a temporary reset token
    const resetToken = generateResetToken();
    
    // Store reset session
    resetSessions.set(resetToken, {
      userId: user.id,
      username,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Security answers verified',
      data: {
        resetToken
      }
    });
  } catch (error) {
    console.error('Error verifying security answers:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while verifying security answers'
    });
  }
};

/**
 * Reset password with security verification
 */
exports.resetPassword = async (req, res) => {
  try {
    const { username, newPassword } = req.body;
    console.log('Received password reset request for username:', username);
    
    // Basic validation
    if (!username || !newPassword) {
      console.log('Missing required parameters:', { username: !!username, newPassword: !!newPassword });
      return res.status(400).json({
        status: 'error',
        message: 'Username and new password are required'
      });
    }
    
    // Find user
    const user = await getOne('SELECT id FROM users WHERE username = ?', [username]);
    
    if (!user) {
      console.log('User not found for password reset:', username);
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    console.log('User found for password reset. User ID:', user.id);
    
    try {
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      console.log(`Updating password for user ${username} (ID: ${user.id})`);
      
      // Update user password - try without updated_at since column doesn't exist anymore
      try {
        const updateResult = await runQuery(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashedPassword, user.id]
        );
        console.log('Password update result:', updateResult);
        console.log(`Password successfully reset for user ${username}`);
      } catch (dbError) {
        console.error('Database error during password reset:', dbError);
        res.status(500).json({
          status: 'error',
          message: 'Database error while resetting password'
        });
      }
      
      res.status(200).json({
        status: 'success',
        message: 'Password reset successful'
      });
    } catch (dbError) {
      console.error('Database error during password reset:', dbError);
      res.status(500).json({
        status: 'error',
        message: 'Database error while resetting password'
      });
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while resetting password'
    });
  }
};

/**
 * Generate a random reset token
 */
function generateResetToken() {
  const tokenLength = 32;
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  for (let i = 0; i < tokenLength; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return token;
} 