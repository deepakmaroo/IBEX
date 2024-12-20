#!/bin/bash
# Exporting a variable without assigning a value

# Bamboo CI script for linting
# Note: this script should be run from the root of the git repository

# Debuggging:
set -e -o pipefail
echo "Loading modules..."

# Set up environment s
BACKEND_ROOT_DIR=$(realpath "$(dirname "$(realpath "${BASH_SOURCE[0]}")")/..")
source ${BACKEND_ROOT_DIR}/ci/configure_env.sh

#set -x

cd ${BACKEND_ROOT_DIR}


if [[ "${RUN_MODE_HOOK}" == "true" ]]; then
    TO_BE_CHECKED=${FILES}
else
    TO_BE_CHECKED=ibex
fi

# Create a venv
python -m venv venv
. venv/bin/activate
echo "PWD: " `pwd`
# PREPARE THE ENVIRONMENT
pip install --upgrade ./[linting]

rm -rf test-reports
mkdir -p test-reports




# STATIC CODE ANALYSIS
# Black: The code formatter
echo -e "${GREEN}Running black...${NC}"
python -m pytest  --black --config-file=pyproject.toml --junitxml=test-reports/black-report.xml ${TO_BE_CHECKED}
#black --check $FILES
if [ $? -ne 0 ]; then
    echo -e "${RED}black check failed. Please fix the issues...${NC}"
    if [[ "${RUN_MODE_HOOK}" == "true" ]]; then
        exit 1
    fi
fi

# isort: a Python utility to sort imports alphabetically
echo -e "${GREEN}Running isort...${NC}"
python -m pytest --isort --config-file=pyproject.toml --junitxml=test-reports/isort-report.xml ${TO_BE_CHECKED}
# isort --check-only $FILES
if [ $? -ne 0 ]; then
    echo -e "${RED}isort check failed. Please fix the issues...${NC}"
    if [[ "${RUN_MODE_HOOK}" == "true" ]]; then
        exit 1
    fi
fi

# Flake8: linting and style checking
echo -e "${GREEN}Running flake8...${NC}"

python -m pytest --flake8 --config-file=pyproject.toml --junitxml=test-reports/flake8-report.xml ${TO_BE_CHECKED}

#flake8 $FILES
if [ $? -ne 0 ]; then
    echo -e "${RED}flake8 check failed. Please fix the issues...${NC}"
    if [[ "${RUN_MODE_HOOK}" == "true" ]]; then
        exit 1
    fi
fi

# Mypy:  a static type checker for Python
echo -e "${GREEN}Running mypy...${NC}"
#mypy $FILES
python -m pytest --mypy --config-file=pyproject.toml --junitxml=test-reports/mypy-report.xml ${TO_BE_CHECKED}
if [ $? -ne 0 ]; then
    echo -e "${RED}mypy check failed. Please fix the issues ...${NC}"
    if [[ "${RUN_MODE_HOOK}" == "true" ]]; then
        exit 1
    fi
fi

# If all checks pass
echo -e "${GREEN}All checks passed. Proceeding with commit...${NC}"
exit 0
