const mongoose = require('mongoose');

const mongoUri = "mongodb+srv://fillds07:Bluedream07@peakmode-cluster.zga2lm1.mongodb.net/peakmode?retryWrites=true&w=majority&authSource=admin&appName=PEAKMODE-Cluster";

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Connection string:', mongoUri);
    
    // Set more detailed debugging
    mongoose.set('debug', true);
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000, // Increase timeout to 15 seconds
      heartbeatFrequencyMS: 5000,     // More frequent heartbeats
    });
    
    console.log('✅ Successfully connected to MongoDB!');
    
    // Check if we can perform a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:');
    collections.forEach(collection => {
      console.log(` - ${collection.name}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.reason) {
      console.error('Error reason type:', error.reason.type);
      console.error('Servers status:');
      if (error.reason.servers) {
        error.reason.servers.forEach((server, host) => {
          console.error(` - ${host}: ${server.state}`);
        });
      }
    }
  } finally {
    // Close the connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
    }
    process.exit();
  }
}

testConnection(); 