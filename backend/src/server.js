/**
 * PEAKMODE Application - Main Server File
 * 
 * This file initializes the Express server, sets up middleware,
 * connects to MongoDB, and starts the server listening for requests.
 */

// Import required packages
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5002;

/**
 * Middleware Configuration
 * - CORS: Allow cross-origin requests
 * - express.json: Parse JSON request body
 * - morgan: HTTP request logger
 */
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

/**
 * Health Check Endpoint
 * Used to verify the API is running properly
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'PEAKMODE API is running',
    timestamp: new Date().toISOString(),
    mongoDBStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    mongoDBReadyState: mongoose.connection.readyState,
    serverInfo: {
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
      hostname: require('os').hostname()
    }
  });
});

/**
 * Monitoring Endpoint
 * Used to verify database connectivity 
 */
app.get('/api/monitor/db', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: 'error',
        message: 'Database disconnected',
        readyState: mongoose.connection.readyState,
        timestamp: new Date().toISOString()
      });
    }
    
    // Test database with a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    res.status(200).json({
      status: 'ok',
      message: 'Database connected',
      readyState: mongoose.connection.readyState,
      collections: collections.map(c => c.name),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error checking database',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Global Error Handler
 * Catches any errors thrown in route handlers
 */
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Something went wrong on the server',
    timestamp: new Date().toISOString()
  });
});

/**
 * MongoDB Connection and Server Startup
 */
const startServer = async () => {
  try {
    // Default to local MongoDB if no environment variable
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/peakmode';
    
    // Log which database we're connecting to
    const isLocal = mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1');
    console.log(`Connecting to ${isLocal ? 'local' : 'remote'} MongoDB database`);
    
    // Simplified MongoDB connection options
    const mongoOptions = {
      // These options are no longer needed in MongoDB driver v4+, but keeping them won't hurt
      serverSelectionTimeoutMS: 5000 // Fail fast if MongoDB is not available
    };
    
    // Connect to MongoDB 
    await mongoose.connect(mongoUri, mongoOptions);
    console.log('✅ Successfully connected to MongoDB');
    
    // Start server on successful database connection
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API is available at http://localhost:${PORT}/api`);
      console.log(`MongoDB Status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();