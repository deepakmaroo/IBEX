#!/bin/bash

# Bamboo CI script for checking syntax by building

# Debuggging:
set -e -o pipefail

# Root directory of the frontend
FRONTEND_ROOT_DIR=$(realpath "$(dirname "$(realpath "${BASH_SOURCE[0]}")")/..")
source ${FRONTEND_ROOT_DIR}/ci/configure-env.sh

# Set up environment
cd ${FRONTEND_ROOT_DIR}

# Start Electron app
echo "Starting Electron app for E2E tests..."
npm run start:e2e &

# Allow app to cleanly start
sleep 180

# Find the real Electron app process using the debug port argument
APP_PID=$(ps -aux | grep ". --remote-debugging-port=9222 --no-watch" | grep -v grep | awk '{print $2}')

if [ -z "$APP_PID" ]; then
  echo "Could not find Electron app process!"
  ps -aux | grep electron || true
  exit 1
fi

# Run tests
echo "Running E2E tests..."
npm run test:e2e
TEST_RESULT=$?

# Stop Electron app
echo "Stopping Electron app (PID $APP_PID)..."
kill $APP_PID || echo "App already stopped"

# Wait a bit and double-check
sleep 2

if ps -p "$APP_PID" > /dev/null; then
  echo "App still running, forcing kill..."
  kill -9 "$APP_PID" || true
else
  echo "App stopped successfully."
fi

if [ $TEST_RESULT -eq 0 ]; then
  echo "✅ E2E tests passed!"
else
  echo "❌ E2E tests failed (exit code $TEST_RESULT)"
fi

exit $TEST_RESULT
