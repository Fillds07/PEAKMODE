const { MongoClient } = require('mongodb');
const dns = require('dns');

// Get MongoDB URI from environment variable or use the direct one
const uri = process.env.MONGODB_URI || 
  "mongodb+srv://fillds07:Bluedream07@peakmode-cluster.zga2lm1.mongodb.net/peakmode?retryWrites=true&w=majority&authSource=admin&maxPoolSize=10&socketTimeoutMS=60000";

console.log('MongoDB Connection Test with DNS Check');
console.log('---------------------------------');

// First check if we can resolve the MongoDB host
const mongoHost = uri.match(/@([^/:]+)/)[1];
console.log(`Checking DNS resolution for MongoDB host: ${mongoHost}`);

dns.lookup(mongoHost, (err, address, family) => {
  if (err) {
    console.error('❌ DNS resolution failed:', err.message);
    console.error('This could indicate network connectivity issues or DNS problems');
    return;
  }
  
  console.log(`✅ DNS resolution successful: ${mongoHost} resolves to ${address} (IPv${family})`);
  console.log('Proceeding with MongoDB connection attempt...');
  
  // Now try to connect to MongoDB
  const client = new MongoClient(uri, {
    connectTimeoutMS: 30000,        // 30 seconds
    socketTimeoutMS: 60000,         // 60 seconds 
    serverSelectionTimeoutMS: 60000, // 60 seconds
    maxPoolSize: 10,                // Default is 100, reducing to prevent connection limits
    minPoolSize: 0                  // Start with 0 connections
  });

  client.connect()
    .then(() => {
      console.log('✅ Connected successfully to MongoDB!');
      // Try a simple operation
      return client.db('peakmode').listCollections().toArray();
    })
    .then(collections => {
      if (collections) {
        console.log('Available collections:');
        collections.forEach(collection => {
          console.log(` - ${collection.name}`);
        });
      }
      return client.close();
    })
    .catch(err => {
      console.error('❌ Connection error:', err.message);
      console.error('Error type:', err.name);
      if (err.code) console.error('Error code:', err.code);
      
      // More detailed diagnostics
      if (err.name === 'MongoServerSelectionError') {
        console.error('\nServer selection error details:');
        if (err.reason) {
          console.error('Reason type:', err.reason.type);
          if (err.reason.servers) {
            console.error('Server statuses:');
            Object.entries(err.reason.servers).forEach(([host, info]) => {
              console.error(` - ${host}: ${info.type || 'unknown'} (${info.error ? info.error.message : 'no error'})`);
            });
          }
        }
        
        console.log('\nPossible solutions:');
        console.log('1. Check if your IP is whitelisted in MongoDB Atlas');
        console.log('2. Verify your VPC/Security Group settings if using AWS');
        console.log('3. Check if MongoDB Atlas is operational: https://status.mongodb.com/');
        console.log('4. Try connecting from a different network to rule out firewall issues');
      }
    })
    .finally(() => {
      console.log('Test completed');
    });
}); 