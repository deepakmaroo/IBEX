#!/bin/sh --login

echo "Loading modules..."

# Set up ITER modules environment
source /etc/profile.d/modules.sh
module purge

# Set up environment
module load nodejs

# Debuggging:
echo "Done loading modules"
echo "Node.js version:"
node -v
echo "NPM version:"
npm -v
