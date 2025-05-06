# MongoDB Atlas VPC Peering with AWS Elastic Beanstalk

This guide will help you set up a secure connection between your AWS Elastic Beanstalk environment and MongoDB Atlas using VPC peering.

## 1. Get Your AWS VPC Information

First, you need to gather information about your AWS VPC where your Elastic Beanstalk environment is running:

```bash
# Get your default VPC ID
aws ec2 describe-vpcs --query "Vpcs[?IsDefault].VpcId" --output text

# Get all your VPCs with their CIDR blocks
aws ec2 describe-vpcs --query "Vpcs[*].[VpcId,CidrBlock,Tags[?Key=='Name'].Value|[0]]" --output table

# Get the VPC ID of your Elastic Beanstalk environment (replace environment-name)
aws elasticbeanstalk describe-environment-resources --environment-name peakmode-backend --query "EnvironmentResources.Instances[0].Id" --output text | xargs aws ec2 describe-instances --instance-ids --query "Reservations[0].Instances[0].VpcId" --output text
```

## 2. Set Up VPC Peering in MongoDB Atlas

1. Log in to MongoDB Atlas: https://cloud.mongodb.com
2. Select your project and go to Network Access
3. Click on the "Peering" tab
4. Click "Add Peering Connection"
5. Select "AWS" as the cloud provider
6. Enter the following details:
   - AWS Account ID: (Get from your AWS Console)
   - VPC ID: (From step 1)
   - VPC CIDR Block: (From step 1)
   - AWS Region: (Same as your Elastic Beanstalk, e.g., us-east-1)
7. Click "Initiate Peering"

## 3. Accept the Peering Connection in AWS

After initiating the peering connection in MongoDB Atlas, you need to accept it in AWS:

1. Go to AWS Console > VPC > Peering Connections
2. Find the pending peering connection from MongoDB Atlas
3. Select it and click "Actions" > "Accept peering connection"

## 4. Update Route Tables

Now you need to update your VPC's route tables to route traffic to MongoDB Atlas:

1. Go to AWS Console > VPC > Route Tables
2. Select the route table associated with your VPC
3. Click "Edit routes"
4. Add a new route:
   - Destination: MongoDB Atlas CIDR (shown in Atlas peering page)
   - Target: The VPC peering connection ID
5. Click "Save changes"

## 5. Update MongoDB Atlas IP Access List

1. Go back to MongoDB Atlas > Network Access
2. Click on the "IP Access List" tab
3. Add an entry for your VPC CIDR range
4. Ensure "0.0.0.0/0" is removed for security (unless needed temporarily for testing)

## 6. Update Your Application's MongoDB Connection String

In your Elastic Beanstalk environment, update the MongoDB connection string to use the private endpoint:

1. Go to MongoDB Atlas > Clusters
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select the appropriate driver and version
5. Copy the connection string
6. Update your application's environment variables:

```bash
# Update your Elastic Beanstalk environment variables
aws elasticbeanstalk update-environment \
  --environment-name peakmode-backend \
  --option-settings "Namespace=aws:elasticbeanstalk:application:environment,OptionName=MONGODB_URI,Value=your_connection_string_here"
```

## 7. Security Considerations

- MongoDB Atlas VPC peering allows secure, private communication without exposing your database to the public internet
- Consider using AWS PrivateLink for even more secure connectivity
- Ensure your security groups allow outbound traffic to the MongoDB Atlas CIDR range
- Keep your MongoDB Atlas IP Access List as restrictive as possible

## Troubleshooting

If you encounter connectivity issues:

1. Verify the VPC peering connection is active in both MongoDB Atlas and AWS
2. Check your route tables are correctly configured
3. Ensure security groups allow outbound traffic to MongoDB Atlas
4. Verify your application is using the correct connection string
5. Check MongoDB Atlas logs for connection attempts

For detailed instructions, see MongoDB's official documentation: https://www.mongodb.com/docs/atlas/security-vpc-peering/ 