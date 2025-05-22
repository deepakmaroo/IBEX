#!/bin/bash

# Bamboo CI script for linting

# Debuggging:
set -e -o pipefail

# Set up environment s
BACKEND_ROOT_DIR=$(realpath "$(dirname "$(realpath "${BASH_SOURCE[0]}")")/..")
source ${BACKEND_ROOT_DIR}/ci/configure_env.sh

#set -x
cd ${BACKEND_ROOT_DIR}

# Create a venv
python -m venv venv
. venv/bin/activate
echo "PWD: " `pwd`

# PREPARE THE ENVIRONMENT
pip install --upgrade ./[benchmark]

# The code correctness check
echo -e "Running benchmarks..."
cd ..
python -m asv run --python=same --verbose

if [ $? -ne 0 ]; then
    echo -e "Benchmark failed. Please fix the issues..."
 fi

exit 0
