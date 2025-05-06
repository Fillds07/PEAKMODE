const { MongoClient } = require('mongodb');

// Updated connection string with retry options
const uri = "mongodb+srv://fillds07:Bluedream07@peakmode-cluster.zga2lm1.mongodb.net/peakmode?retryWrites=true&w=majority&authSource=admin&maxPoolSize=10&socketTimeoutMS=60000";

console.log('Connecting with optimized connection string...');

const client = new MongoClient(uri, {
  connectTimeoutMS: 30000,        // 30 seconds
  socketTimeoutMS: 60000,         // 60 seconds 
  serverSelectionTimeoutMS: 60000, // 60 seconds
  maxPoolSize: 10,                // Default is 100, reducing to prevent connection limits
  minPoolSize: 0                  // Start with 0 connections
});

client.connect()
  .then(() => {
    console.log('Connected successfully to MongoDB!');
    return client.close();
  })
  .catch(err => {
    console.error('Connection error:', err.message);
    console.error('Error type:', err.name);
    if (err.code) console.error('Error code:', err.code);
  })
  .finally(() => {
    console.log('Test completed');
  }); 