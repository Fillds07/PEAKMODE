#!/usr/bin/env node

/**
 * Script to update MongoDB environment variables in AWS Elastic Beanstalk
 * 
 * Usage:
 *   node update-eb-mongodb-env.js 
 * 
 * Prerequisites:
 *   - AWS CLI installed and configured
 *   - AWS IAM permissions for Elastic Beanstalk
 */

const { spawn } = require('child_process');
const readline = require('readline');

// Elastic Beanstalk environment name
const EB_ENV_NAME = 'peakmode-backend';

// MongoDB connection details
const DEFAULT_MONGODB_URI = "mongodb+srv://fillds07:Bluedream07@peakmode-cluster.zga2lm1.mongodb.net/peakmode?retryWrites=true&w=majority&authSource=admin&maxIdleTimeMS=45000&connectTimeoutMS=30000&socketTimeoutMS=60000";

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to execute AWS CLI commands
const executeCommand = (command, args) => {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args);
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
};

// Function to check if Elastic Beanstalk environment exists
const checkEnvironmentExists = async () => {
  try {
    const result = await executeCommand('aws', [
      'elasticbeanstalk', 
      'describe-environments',
      '--environment-names', 
      EB_ENV_NAME,
      '--query', 
      'Environments[0].EnvironmentName'
    ]);
    
    return result.trim() === `"${EB_ENV_NAME}"`;
  } catch (error) {
    return false;
  }
};

// Main function
const main = async () => {
  console.log('MongoDB Environment Variables Updater for AWS Elastic Beanstalk');
  console.log('================================================================');
  
  // Check if environment exists
  const envExists = await checkEnvironmentExists();
  if (!envExists) {
    console.error(`Error: Elastic Beanstalk environment '${EB_ENV_NAME}' not found.`);
    rl.close();
    return;
  }
  
  console.log(`Found Elastic Beanstalk environment: ${EB_ENV_NAME}`);
  
  // Ask for MongoDB URI
  rl.question(`Enter MongoDB URI (press Enter for default):\n[${DEFAULT_MONGODB_URI.substring(0, DEFAULT_MONGODB_URI.indexOf('@') + 1)}***] `, async (customUri) => {
    const mongoUri = customUri || DEFAULT_MONGODB_URI;
    
    // Confirm update
    rl.question(`Are you sure you want to update the MongoDB URI for ${EB_ENV_NAME}? (y/n) `, async (answer) => {
      if (answer.toLowerCase() === 'y') {
        try {
          console.log('Updating environment variables...');
          
          // Update MongoDB URI
          await executeCommand('aws', [
            'elasticbeanstalk',
            'update-environment',
            '--environment-name',
            EB_ENV_NAME,
            '--option-settings',
            `Namespace=aws:elasticbeanstalk:application:environment,OptionName=MONGODB_URI,Value=${mongoUri}`
          ]);
          
          // Update direct connection settings
          await executeCommand('aws', [
            'elasticbeanstalk',
            'update-environment',
            '--environment-name',
            EB_ENV_NAME,
            '--option-settings',
            'Namespace=aws:elasticbeanstalk:application:environment,OptionName=MONGODB_DIRECT_CONNECTION,Value=true'
          ]);
          
          console.log('Environment variables updated successfully!');
          console.log('Note: It may take a few minutes for the changes to apply.');
          
          // Get the environment URL
          const urlResult = await executeCommand('aws', [
            'elasticbeanstalk',
            'describe-environments',
            '--environment-names',
            EB_ENV_NAME,
            '--query',
            'Environments[0].CNAME',
            '--output',
            'text'
          ]);
          
          console.log(`\nYou can check the health of your application at:`);
          console.log(`http://${urlResult.trim()}/api/health`);
          
        } catch (error) {
          console.error('Error updating environment variables:', error.message);
        }
      } else {
        console.log('Update canceled.');
      }
      
      rl.close();
    });
  });
};

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
}); 