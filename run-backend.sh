#!/bin/bash
# PEAKMODE Backend Start Script
echo -e "\033[1m\033[34mStarting PEAKMODE backend...\033[0m"
cd "$(dirname "$0")/backend"
npm run dev
