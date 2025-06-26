#!/bin/bash

# Bamboo CI script for linting

# Debuggging:
set -e -o pipefail

# Root directory of the frontend
FRONTEND_ROOT_DIR=$(realpath "$(dirname "$(realpath "${BASH_SOURCE[0]}")")/..")
source ${FRONTEND_ROOT_DIR}/ci/configure-env.sh

# Set up environment
cd ${FRONTEND_ROOT_DIR}

#Install packages
echo "Cleaning and installing packages..."
npm ci 
if [ $? -ne 0 ]; then
    echo "Failed to install dependencies. Please check the npm logs."
    exit 1
fi

# Run selenium tests

echo "Start electron app test mode..."
npm run start:e2e &
ELECTRON_PID=$!
echo "Waiting for electron app to start..."
sleep 10

# Run tests
echo "Running tests..."
npm run test:e2e
if [ $? -ne 0 ]; then
    echo "Tests failed. Please check the test logs."
    kill $ELECTRON_PID
    exit 1
fi

# Kill the electron app
echo "Killing electron app..."
kill $ELECTRON_PID
if [ $? -ne 0 ]; then
    echo "Failed to kill electron app. Please check the process."
    exit 1
fi
echo "All tests passed successfully."
# Exit successfully
exit 0

# End of script
# This script is used to run user interface tests in the frontend of the application.

