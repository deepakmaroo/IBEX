#!/bin/sh --login

echo "Loading modules..."

# Set up ITER modules environment
source /etc/profile.d/modules.sh
module purge

# Set up environment
module load IDStools/2.1.0-intel-2023b IMAS-Python/2.0.0-intel-2023b

# Debuggging:
echo "Done loading modules"
