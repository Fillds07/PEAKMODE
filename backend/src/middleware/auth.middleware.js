const { getOne } = require('../models/database');

// Authentication middleware - No longer using tokens
const authMiddleware = async (req, res, next) => {
  try {
    // Get username from headers, query, or body - in that order of priority
    // This ensures that when updating username in the body, we still authenticate with the current username in headers
    const username = req.headers.username || req.query.username || req.body.username;
    
    if (!username) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized - No username provided'
      });
    }
    
    // Check if user exists in database
    const user = await getOne('SELECT id, username, email, name, phone FROM users WHERE username = ?', [username]);
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized - User not found'
      });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during authentication'
    });
  }
};

module.exports = authMiddleware; 