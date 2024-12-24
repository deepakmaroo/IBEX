#!/bin/sh --login

echo "Loading modules..."

# Set up ITER modules environment
source /etc/profile.d/modules.sh
module purge

# Set up environment
module load IMASPy/1.1.1-foss-2023b

# Debuggging:
echo "Done loading modules"
