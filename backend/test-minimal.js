const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://fillds07:Bluedream07@peakmode-cluster.zga2lm1.mongodb.net/?retryWrites=true&w=majority";

console.log('Connecting with URI:', uri);

const client = new MongoClient(uri);

client.connect()
  .then(() => {
    console.log('Connected successfully to MongoDB!');
    return client.close();
  })
  .catch(err => {
    console.error('Connection error:', err.message);
  })
  .finally(() => {
    console.log('Test completed');
  }); 