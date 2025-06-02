#!/bin/bash

# Bamboo CI script for linting

# Debuggging:
set -e -o pipefail

# Set up environment s
BACKEND_ROOT_DIR=$(realpath "$(dirname "$(realpath "${BASH_SOURCE[0]}")")/..")
source ${BACKEND_ROOT_DIR}/ci/configure_env.sh

BENCHMARKS_DIR=$(realpath "$PWD/ibex_benchmarks")
if [[ "$(uname -n)" == *"bamboo"* ]]; then
    set -e -o pipefail
    # create
    BENCHMARKS_DIR=$(realpath "/mnt/bamboo_deploy/ibex/benchmarks/")
fi

#set -x
cd ${BACKEND_ROOT_DIR}

export ASV_PYTHONPATH="$PYTHONPATH"

# Create a venv
python -m venv venv
. venv/bin/activate
echo "PWD: " `pwd`

# PREPARE THE ENVIRONMENT
pip install --upgrade ./[benchmark]

# Copy previous results (if any)
mkdir -p "$BENCHMARKS_DIR/results"
mkdir -p .asv
cp -rf "$BENCHMARKS_DIR/results" .asv/

# Ensure there is a machine configuration
asv machine --yes

# Run benchmarks
echo -e "Running benchmarks..."
cd ..
asv run --skip-existing-successful HEAD^!
asv run --skip-existing-successful develop^!
#asv run --skip-existing-successful master^!

# Compare results
if [ `git rev-parse --abbrev-ref HEAD` == develop ]
then
    echo "skipping master -> develop comparison"
    #asv compare master develop --machine $(hostname) || echo "asv compare failed"
else
    asv compare develop HEAD --machine $(hostname) || echo "asv compare failed"
fi

# Publish results
asv publish

# And persistently store them
mkdir -p "$BENCHMARKS_DIR" && cp -rf .asv/{results,html} "$BENCHMARKS_DIR"
exit 0
