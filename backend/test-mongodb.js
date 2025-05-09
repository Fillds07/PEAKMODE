/**
 * Simple MongoDB Connection Test
 * 
 * This script attempts to connect to a local MongoDB instance
 * and prints the connection status.
 */

const mongoose = require('mongoose');

// Use local MongoDB connection string
const uri = 'mongodb://localhost:27017/peakmode';

console.log('Testing MongoDB connection...');
console.log(`Connecting to: ${uri}`);

mongoose.connect(uri)
  .then(() => {
    console.log('✅ Successfully connected to MongoDB!');
    console.log('Connection state:', mongoose.connection.readyState);
    
    // List collections in the database
    return mongoose.connection.db.listCollections().toArray();
  })
  .then((collections) => {
    if (collections.length === 0) {
      console.log('Database exists but has no collections yet');
    } else {
      console.log('Collections in database:');
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    }
    
    // Close the connection
    return mongoose.connection.close();
  })
  .then(() => {
    console.log('Connection closed');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }); 