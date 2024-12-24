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
time pip install --upgrade ./[linting]



rm -rf test-reports
mkdir -p test-reports

# STATIC CODE ANALYSIS

# The code correctness check
echo -e "Running code correctness check and fixes..."
python -m ruff check  --no-cache --output-format junit --output-file test-reports/lint-report.xml ibex

if [ $? -ne 0 ]; then
    echo -e "Code correctness check failed. Please fix the issues..."
 fi

# The code formatting check
#echo -e "Running code formatting..."
#python -m ruff format --no-cache --check --output-format junit --output-file test-reports/format-report.xml ibex

#if [ $? -ne 0 ]; then
#    echo -e "Code formatting failed. Please fix the issues..."
# fi

# If all checks pass
#echo -e "All checks passed. "
exit 0
