#!/bin/bash
# PEAKMODE Frontend Start Script
echo -e "\033[1m\033[34mStarting PEAKMODE frontend...\033[0m"
cd "$(dirname "$0")/frontend"
npm start
