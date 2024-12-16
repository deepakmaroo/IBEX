#!/bin/bash
# Bamboo CI script for linting
# Note: this script should be run from the root of the git repository

# Debuggging:
set -e -o pipefail
echo "Loading modules..."

# Set up environment s
source backend/ci/configure_env.sh



set -x

# Create a venv
rm -rf venv
python -m venv venv
. venv/bin/activate

# Install and run linters
pip install --upgrade backend[linting]

black --check backend/ibex
flake8 backend/ibex
mypy backend/ibex
isort --check-only backend/ibex