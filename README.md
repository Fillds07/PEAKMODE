# PEAKMODE Application

A mobile application for energy management and wellness tracking.

## Quick Start Guide

After cloning the repository, follow these simple steps:

### 1. First-Time Setup

Run the initiate script to set up your development environment:

```bash
chmod +x initiate.sh  # Make script executable
./initiate.sh
```

This script will:
- Install required software (Node.js, MongoDB, Expo CLI)
- Make all scripts executable
- Configure your environment for PEAKMODE development

### 2. Install Dependencies

Install all project dependencies:

```bash
./install.sh
```

### 3. Start the Application

Start the backend (in one terminal):

```bash
./start-backend.sh
```

Start the frontend (in another terminal):

```bash
./start-frontend.sh
```

## Additional Features

### Tunneling for External Access

Make your backend accessible from outside your network:

```bash
./start-backend-tunnel.sh
```

This creates an ngrok tunnel that gives you a public URL to share with others.

### Expo Tunnel for Testing on Devices

Test the frontend on devices not on your local network:

```bash
./start-frontend.sh --tunnel
```

## Stopping Services

- Press `Ctrl+C` in each terminal to stop running services
- To stop MongoDB: `brew services stop mongodb/brew/mongodb-community@7.0`

## Troubleshooting

- **MongoDB connection problems**: Try `brew services restart mongodb/brew/mongodb-community@7.0`
- **Frontend dependency issues**: The install script uses `--legacy-peer-deps` to handle conflicts
- **Networking issues**: Use the tunneling options mentioned above 