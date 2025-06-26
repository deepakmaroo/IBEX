#!/bin/bash

# Bamboo CI script for linting

# Root directory of the frontend
FRONTEND_ROOT_DIR=$(realpath "$(dirname "$(realpath "${BASH_SOURCE[0]}")")/..")

# Set up environment
cd ${FRONTEND_ROOT_DIR}

#Install packages
echo "Cleaning and installing packages..."
npm ci 
if [ $? -ne 0 ]; then
    echo "Failed to install dependencies. Please check the npm logs."
    exit 1
fi

# Run formatting code
echo "Running formatting code..."
npm run format

if [ $? -ne 0 ]; then
    echo "Code formatting failed. Please fix the issues."
    exit 1
fi

# Run linting
echo "Running linting..."
npm run lint

if [ $? -ne 0 ]; then
    echo "Linting failed. Please fix the issues."
    exit 1
fi