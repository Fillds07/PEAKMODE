const { MongoClient } = require('mongodb');

// Using a direct connection to the replica set members
const uri = "mongodb://fillds07:Bluedream07@ac-slvjmsq-shard-00-00.zga2lm1.mongodb.net:27017,ac-slvjmsq-shard-00-01.zga2lm1.mongodb.net:27017,ac-slvjmsq-shard-00-02.zga2lm1.mongodb.net:27017/peakmode?ssl=true&replicaSet=atlas-12gcog-shard-0&authSource=admin";

console.log('Connecting with direct replica set URI...');

const client = new MongoClient(uri);

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