const { MongoClient } = require('mongodb');
const axios = require('axios');

// The MongoDB URI
const uri = "mongodb+srv://fillds07:Bluedream07@peakmode-cluster.zga2lm1.mongodb.net/peakmode?retryWrites=true&w=majority&authSource=admin";

// Get current public IP address
const getPublicIP = async () => {
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    return response.data.ip;
  } catch (error) {
    console.error('Error getting public IP:', error.message);
    return null;
  }
};

// Function to check MongoDB Atlas connection
const checkMongoDBAccess = async () => {
  console.log('MongoDB Atlas Access Check');
  console.log('=========================');
  
  // Get current public IP
  const publicIP = await getPublicIP();
  console.log(`Current public IP address: ${publicIP}`);
  
  // Create MongoDB client with short timeout
  const client = new MongoClient(uri, {
    connectTimeoutMS: 15000,
    serverSelectionTimeoutMS: 15000
  });
  
  try {
    console.log('Attempting to connect to MongoDB Atlas...');
    await client.connect();
    
    console.log('✅ Connected to MongoDB Atlas successfully!');
    
    // Try to access a collection
    const db = client.db('peakmode');
    const collections = await db.listCollections().toArray();
    
    console.log('\nAvailable collections:');
    if (collections.length === 0) {
      console.log('No collections found in the database');
    } else {
      collections.forEach(col => {
        console.log(` - ${col.name}`);
      });
    }
    
    console.log('\nConnection Information:');
    console.log(` - Database: ${db.databaseName}`);
    console.log(` - Connection String: ${uri.substring(0, uri.indexOf('@') + 1)}***`);
    
    console.log('\nAccess List Recommendations:');
    console.log(` - Your current IP (${publicIP}) should be in the MongoDB Atlas IP access list`);
    console.log(' - For production, set up VPC peering between AWS and MongoDB Atlas');
    console.log(' - Temporarily, you can add 0.0.0.0/0 to allow access from anywhere (not recommended for production)');
    
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB Atlas');
    console.error(`Error: ${error.message}`);
    
    if (error.message.includes('authentication failed')) {
      console.error('\nPossible cause: Invalid username or password in connection string');
    } else if (error.message.includes('IP address') || error.message.includes('whitelist')) {
      console.error('\nPossible cause: Your IP address is not in the MongoDB Atlas IP access list');
      console.error(`Add your current IP (${publicIP}) to the MongoDB Atlas IP access list`);
      console.error('Alternatively, temporarily add 0.0.0.0/0 to allow access from anywhere (not recommended for production)');
    }
    
    console.error('\nTo fix IP access list issues:');
    console.error('1. Go to MongoDB Atlas > Network Access');
    console.error('2. Click "Add IP Address"');
    console.error(`3. Add your current IP: ${publicIP}`);
    console.error('4. Or temporarily add 0.0.0.0/0 for testing');
  } finally {
    await client.close();
    console.log('\nConnection closed');
  }
};

// Run the check
checkMongoDBAccess().catch(console.error); 