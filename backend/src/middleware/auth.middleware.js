const jwt = require('jsonwebtoken');
const { getOne } = require('../models/database');

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'peakmode-secret-key';

// Authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized - No token provided'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user exists in database
    const user = await getOne('SELECT id, username, email, name FROM users WHERE id = ?', [decoded.id]);
    
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
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized - Invalid token'
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during authentication'
    });
  }
};

module.exports = authMiddleware; 