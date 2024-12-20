#!/usr/bin/env bash

BACKEND_ROOT_DIR=$(dirname "$(realpath "${BASH_SOURCE[0]}")")

PRE_COMMIT_HOOK_PATH="$(realpath "${BACKEND_ROOT_DIR}/../.git/hooks/pre-commit")"

echo ${PRE_COMMIT_HOOK_PATH}
cat > ${PRE_COMMIT_HOOK_PATH} << SCRIPT_BLOCK

# Custom Git pre-commit hook for Python code quality checks
BACKEND_ROOT_DIR=${BACKEND_ROOT_DIR}

# Define colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No color

# Find staged Python files
FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '\.py$')
#FILES=$(git diff --cached --name-only --diff-filter=ACM)
if [ -z "\$FILES" ]; then
    echo -e "\${YELLOW}No staged Python files to check.\${NC}"
    exit 0
fi

RUN_MODE_HOOK=true
echo -e "\${YELLOW}Running checks on staged Python files...\${NC}"

source \${BACKEND_ROOT_DIR}/ci/linting.sh

SCRIPT_BLOCK

chmod +x ${PRE_COMMIT_HOOK_PATH}