#!/bin/bash
# In progress ...
# We need to run start:e2e and test:e2e in the same terminal, 
# but since start:e2e never stops, test:e2e doesn't run. 
# Selenium needs the interface to run user-interface tests.
echo "....SCRIPT IN PROGRESS...."

set -euo pipefail

FRONTEND_ROOT_DIR=$(realpath "$(dirname "${BASH_SOURCE[0]}")/..")
source "${FRONTEND_ROOT_DIR}/ci/configure-env.sh"
cd "${FRONTEND_ROOT_DIR}"

LOG_FILE="./logs/electron.log"
READY_MESSAGE="App is ready"

mkdir -p ./logs
> "$LOG_FILE"

echo "Starting Electron in test mode..."
npm run start:e2e > "$LOG_FILE" 2>&1 &
ELECTRON_PID=$!

cleanup() {
  echo "Cleaning up..."
  kill "$ELECTRON_PID" || true
}
trap cleanup EXIT

echo "Waiting for Electron to be ready..."

# Lire le fichier de log en live, dans le même shell
READY=0
SECONDS=0
while IFS= read -r line; do
  echo "[electron log] $line"
  if [[ "$line" == *"$READY_MESSAGE"* ]]; then
    READY=1
    break
  fi
  [[ $SECONDS -gt 30 ]] && break
done < <(tail -n +1 -F "$LOG_FILE")

if [[ $READY -ne 1 ]]; then
  echo "Electron did not become ready in time."
  exit 1
fi

echo "Electron is ready. Running Selenium tests..."
npm run test:e2e
