#!/usr/bin/env bash

# Set up environment s
BACKEND_ROOT_DIR=$(dirname "$(realpath "${BASH_SOURCE[0]}")")
source ${BACKEND_ROOT_DIR}/ci/configure_env.sh

# Create a venv
python -m venv venv
. venv/bin/activate
echo "PWD: " `pwd`

pip install --upgrade pre-commit

pre-commit install -f