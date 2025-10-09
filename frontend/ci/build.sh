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

# Run build
echo "Running build..."
npm run build

if [ $? -ne 0 ]; then
    echo "Build failed. Please fix the issues."
    exit 1
fi
