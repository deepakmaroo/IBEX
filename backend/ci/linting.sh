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
python -m venv venv
. venv/bin/activate

# Install and run linters
pip install --upgrade ./backend[linting]

# Static code analysis
rm -rf test-reports
mkdir -p test-reports

# Black: The code formatter
python -m pytest backend/ibex --black --config-file=backend/pyproject.toml --junitxml=test-reports/black-report.xml

# isort: a Python utility to sort imports alphabetically
python -m pytest backend/ibex --isort --config-file=backend/pyproject.toml --junitxml=test-reports/isort-report.xml

# Mypy:  a static type checker for Python
python -m pytest backend/ibex --mypy --config-file=backend/pyproject.toml --junitxml=test-reports/mypy-report.xml

# Flake8: linting and style checking
python -m pytest backend/ibex --flake8 --config-file=backend/pyproject.toml --junitxml=test-reports/flake8-report.xml
