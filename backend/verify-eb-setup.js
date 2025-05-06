/**
 * Elastic Beanstalk and MongoDB Atlas Connection Verification
 * 
 * This script will:
 * 1. Check if the Elastic Beanstalk environment is accessible
 * 2. Verify MongoDB connection string format and validity
 * 3. Check DNS resolution for MongoDB host
 * 4. Test connection to MongoDB from the local environment
 * 5. Test connection to MongoDB from Elastic Beanstalk
 */

const https = require('https');
const dns = require('dns');
const { MongoClient } = require('mongodb');
const { execSync } = require('child_process');

// Your configuration
const EB_URL = 'https://peakmode-backend.eba-6pcej9t8.us-east-1.elasticbeanstalk.com';
const MONGO_URI = 'mongodb+srv://fillds07:Bluedream07@peakmode-cluster.zga2lm1.mongodb.net/?retryWrites=true&w=majority'; 

// ANSI color codes for prettier output
const COLORS = {
  RESET: '\x1b[0m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  BOLD: '\x1b[1m'
};

/**
 * Print a colored status message
 */
function printStatus(status, message) {
  const color = status === 'SUCCESS' ? COLORS.GREEN : 
                status === 'WARNING' ? COLORS.YELLOW : 
                status === 'ERROR' ? COLORS.RED : COLORS.BLUE;
  
  const icon = status === 'SUCCESS' ? '✅' : 
               status === 'WARNING' ? '⚠️' : 
               status === 'ERROR' ? '❌' : 'ℹ️';
  
  console.log(`${icon} ${color}${message}${COLORS.RESET}`);
}

/**
 * Parse MongoDB URI to extract host for DNS checks
 */
function extractMongoHost(uri) {
  try {
    if (!uri.includes('mongodb+srv://') && !uri.includes('mongodb://')) {
      return null;
    }
    
    // Remove protocol
    let host = uri.replace(/^mongodb(\+srv)?:\/\//, '');
    
    // Remove credentials if present
    if (host.includes('@')) {
      host = host.split('@')[1];
    }
    
    // Remove path and query params
    if (host.includes('/')) {
      host = host.split('/')[0];
    }
    
    // For standard connection strings, remove port if present
    if (host.includes(':')) {
      host = host.split(':')[0];
    }
    
    return host;
  } catch (error) {
    console.error('Error parsing MongoDB URI:', error.message);
    return null;
  }
}

/**
 * Check if EB environment is accessible
 */
async function checkEBEnvironment() {
  console.log(`\n${COLORS.BOLD}Checking Elastic Beanstalk Environment${COLORS.RESET}`);
  console.log('-'.repeat(45));
  
  return new Promise((resolve) => {
    https.get(`${EB_URL}/api/health`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const responseData = JSON.parse(data);
            printStatus('SUCCESS', `EB environment is accessible (Status: ${res.statusCode})`);
            
            if (responseData.mongoDBStatus === 'connected') {
              printStatus('SUCCESS', 'MongoDB connection reported as working on EB');
            } else {
              printStatus('ERROR', `MongoDB connection issue on EB: ${responseData.mongoDBStatus || 'not connected'}`);
            }
            
            resolve(true);
          } catch (e) {
            printStatus('WARNING', `EB environment is accessible but response is not valid JSON`);
            resolve(false);
          }
        } else {
          printStatus('ERROR', `EB environment returned status code: ${res.statusCode}`);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      printStatus('ERROR', `Failed to connect to EB environment: ${err.message}`);
      resolve(false);
    });
  });
}

/**
 * Check DNS resolution for MongoDB host
 */
async function checkDNSResolution() {
  console.log(`\n${COLORS.BOLD}Checking DNS Resolution${COLORS.RESET}`);
  console.log('-'.repeat(45));
  
  const host = extractMongoHost(MONGO_URI);
  if (!host) {
    printStatus('ERROR', 'Could not extract MongoDB host from connection string');
    return false;
  }
  
  printStatus('INFO', `MongoDB host: ${host}`);
  
  return new Promise((resolve) => {
    dns.resolve(host, (err, addresses) => {
      if (err) {
        printStatus('ERROR', `DNS resolution failed: ${err.message}`);
        resolve(false);
      } else {
        printStatus('SUCCESS', `DNS resolution successful. IP addresses: ${addresses.join(', ')}`);
        resolve(true);
      }
    });
  });
}

/**
 * Test local MongoDB connection
 */
async function testLocalMongoConnection() {
  console.log(`\n${COLORS.BOLD}Testing Local MongoDB Connection${COLORS.RESET}`);
  console.log('-'.repeat(45));
  
  const client = new MongoClient(MONGO_URI, { 
    connectTimeoutMS: 15000,
    socketTimeoutMS: 15000,
    serverSelectionTimeoutMS: 15000
  });
  
  try {
    await client.connect();
    const databasesList = await client.db().admin().listDatabases();
    
    printStatus('SUCCESS', 'Connected to MongoDB Atlas from local environment');
    printStatus('INFO', `Available databases: ${databasesList.databases.map(db => db.name).join(', ')}`);
    
    return true;
  } catch (error) {
    printStatus('ERROR', `Failed to connect to MongoDB: ${error.message}`);
    return false;
  } finally {
    await client.close();
  }
}

/**
 * Check EB environment variables
 */
function checkEBEnvironmentVariables() {
  console.log(`\n${COLORS.BOLD}Checking Elastic Beanstalk Environment Variables${COLORS.RESET}`);
  console.log('-'.repeat(45));
  
  try {
    // Run EB CLI to get environment variables
    const ebOutput = execSync('aws elasticbeanstalk describe-configuration-settings --application-name peakmode --environment-name peakmode-backend --query "ConfigurationSettings[0].OptionSettings[?Namespace==\'aws:elasticbeanstalk:application:environment\']"');
    
    const envVars = JSON.parse(ebOutput.toString());
    
    // Check if MongoDB connection string is set
    const mongoVar = envVars.find(v => v.OptionName === 'MONGODB_URI');
    
    if (mongoVar) {
      printStatus('SUCCESS', 'MONGODB_URI environment variable is set in Elastic Beanstalk');
      
      // Check if value matches expected format (without showing actual credentials)
      const val = mongoVar.Value || '';
      if (val.startsWith('mongodb+srv://') || val.startsWith('mongodb://')) {
        printStatus('SUCCESS', 'MONGODB_URI has correct format');
      } else {
        printStatus('ERROR', 'MONGODB_URI does not have correct format');
      }
    } else {
      printStatus('ERROR', 'MONGODB_URI environment variable is not set in Elastic Beanstalk');
    }
    
    return true;
  } catch (error) {
    printStatus('ERROR', `Failed to check EB environment variables: ${error.message}`);
    console.log('You may need to run "aws configure" to set up AWS credentials.');
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log(`${COLORS.BOLD}MongoDB Atlas and Elastic Beanstalk Connection Verification${COLORS.RESET}`);
  console.log('='.repeat(65));
  console.log('This script helps diagnose connectivity issues between your AWS Elastic Beanstalk');
  console.log('application and MongoDB Atlas.');
  console.log('');
  
  // Run all checks
  const checks = [
    { name: 'Elastic Beanstalk environment', fn: checkEBEnvironment },
    { name: 'DNS resolution for MongoDB host', fn: checkDNSResolution },
    { name: 'Local MongoDB connection', fn: testLocalMongoConnection },
    { name: 'Elastic Beanstalk environment variables', fn: checkEBEnvironmentVariables }
  ];
  
  const results = {};
  
  for (const check of checks) {
    results[check.name] = await check.fn();
  }
  
  // Summary
  console.log(`\n${COLORS.BOLD}Summary${COLORS.RESET}`);
  console.log('-'.repeat(45));
  
  for (const [name, success] of Object.entries(results)) {
    console.log(`${success ? '✅' : '❌'} ${name}`);
  }
  
  // Recommendations
  console.log(`\n${COLORS.BOLD}Recommendations${COLORS.RESET}`);
  console.log('-'.repeat(45));
  
  if (!results['DNS resolution for MongoDB host']) {
    console.log('1. Check your network DNS configuration');
    console.log('2. Verify that the MongoDB Atlas host is correct');
    console.log('3. Try using a different DNS server (e.g., 8.8.8.8 or 1.1.1.1)');
  }
  
  if (!results['Elastic Beanstalk environment variables']) {
    console.log('1. Update EB environment variables with correct MongoDB URI');
    console.log('   Run: node update-eb-mongodb-env.js');
  }
  
  if (results['Local MongoDB connection'] && !results['Elastic Beanstalk environment']) {
    console.log('1. Check if your AWS VPC security group allows outbound traffic to MongoDB Atlas');
    console.log('2. Make sure your MongoDB Atlas IP access list includes 0.0.0.0/0 or your EB instance IP');
    console.log('3. Consider setting up VPC peering for a more secure connection');
  }
  
  console.log('\nFor more details on VPC peering setup, see mongo-vpc-setup-guide.md');
}

// Run the script
main().catch(console.error); 