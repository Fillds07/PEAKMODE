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
 * Connects to MongoDB with retry logic
 * @param {string} uri - MongoDB connection string
 * @param {object} options - Connection options
 * @param {number} retryCount - Number of retries
 * @returns {Promise} - Resolves when connected
 */
const connectWithRetry = async (uri, options, retryCount = 5) => {
  let lastError;
  
  for (let i = 0; i < retryCount; i++) {
    try {
      console.log(`MongoDB connection attempt ${i + 1} of ${retryCount}...`);
      await mongoose.connect(uri, options);
      console.log('✅ Successfully connected to MongoDB Atlas');
      return;
    } catch (error) {
      console.error(`Failed connection attempt ${i + 1}:`, error.message);
      lastError = error;
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      const delay = Math.pow(2, i) * 1000;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // After all retries failed
  throw lastError;
};

/**
 * MongoDB Connection and Server Startup
 */
const startServer = async () => {
  try {
    // Get MongoDB URI from environment variables or use fallback direct connection
    let mongoUri = process.env.MONGODB_URI;
    
    // If no environment variable is set, use a direct connection string to the replica set
    if (!mongoUri) {
      console.log('No MONGODB_URI environment variable found, using direct replica set connection');
      mongoUri = "mongodb+srv://fillds07:Bluedream07@peakmode-cluster.zga2lm1.mongodb.net/peakmode?retryWrites=true&w=majority&authSource=admin&maxIdleTimeMS=45000&connectTimeoutMS=30000&socketTimeoutMS=60000";
    }
    
    console.log(`Using MongoDB connection string starting with: ${mongoUri.substring(0, mongoUri.indexOf('@') + 1)}***`);
    
    // Improved MongoDB connection options
    const mongoOptions = {
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000,
      serverSelectionTimeoutMS: 60000,
      maxPoolSize: 10,
      minPoolSize: 0,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      directConnection: process.env.MONGODB_DIRECT_CONNECTION === 'true'
    };
    
    // Connect to MongoDB with retry logic
    console.log('Connecting to MongoDB Atlas...');
    await connectWithRetry(mongoUri, mongoOptions);
    
    // Set up connection monitoring
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected! Attempting to reconnect...');
      // Reconnect if disconnected
      connectWithRetry(mongoUri, mongoOptions).catch(err => {
        console.error('Failed to reconnect to MongoDB:', err.message);
      });
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err.message);
    });
    
    // Start server on successful database connection
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API is available at http://localhost:${PORT}/api`);
      console.log(`MongoDB Status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    
    if (error.name === 'MongoServerSelectionError') {
      console.error('Could not connect to any MongoDB server');
      console.error('Error details:', error.message);
      
      if (error.reason) {
        console.error('Reason type:', error.reason.type);
        if (error.reason.servers) {
          console.error('Server statuses:');
          Object.entries(error.reason.servers).forEach(([host, info]) => {
            console.error(` - ${host}: ${info.type || 'unknown'} (${info.error ? info.error.message : 'no error'})`);
          });
        }
      }
      
      console.error('\nTROUBLESHOOTING STEPS:');
      console.error('1. Check that your IP is whitelisted in MongoDB Atlas (https://cloud.mongodb.com > Network Access)');
      console.error('2. Verify your VPC settings if using AWS');
      console.error('3. Check MongoDB Atlas status page: https://status.mongodb.com/');
      console.error('4. Verify your MongoDB Atlas connection string');
      
      throw new Error('Critical error: Unable to connect to MongoDB. Cannot start server without database connection for production.');
    }
    
    throw error;
  }
};

// Start the server
startServer().catch(error => {
  console.error('Fatal error starting server:', error.message);
  process.exit(1);
});