#!/bin/bash

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "1. Loading required modules..."
module load IDStools IMAS-Python nodejs

echo "2. Setting up Python virtual environment..."
cd "$SCRIPT_DIR"
python -m venv venv
source venv/bin/activate

echo "3. Installing backend in editable mode..."
cd "$SCRIPT_DIR/backend"
pip install -e .

echo "4. Launch backend server..."
./bin/run_ibex_service &
BACKEND_PID=$!
cd "$SCRIPT_DIR"

echo "5. Installing frontend dependencies..."
cd "$SCRIPT_DIR/frontend"
npm install

echo "6. Launch frontend server..."
npm run start &
FRONTEND_PID=$!
cd "$SCRIPT_DIR"

# Wait for both processes to finish
wait $BACKEND_PID $FRONTEND_PID