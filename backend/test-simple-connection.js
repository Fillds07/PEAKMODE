const { MongoClient } = require('mongodb');

// Replace with your own connection string - I'm omitting the password here for security
const uri = "mongodb+srv://fillds07:Bluedream07@peakmode-cluster.zga2lm1.mongodb.net/?retryWrites=true&w=majority";

async function testConnection() {
  const client = new MongoClient(uri);

  try {
    console.log('Attempting to connect to MongoDB...');
    await client.connect();
    console.log('✅ Successfully connected to MongoDB!');
    
    const dbs = await client.db().admin().listDatabases();
    console.log('Available databases:');
    dbs.databases.forEach(db => {
      console.log(` - ${db.name}`);
    });

  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
  } finally {
    await client.close();
    console.log('MongoDB connection closed.');
  }
}

testConnection().catch(console.error); 