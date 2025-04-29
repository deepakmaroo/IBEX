#!/bin/bash

set -e

echo "1. Loading required modules..."
module load IMASPy IDStools nodejs

echo "2. Setting up Python virtual environment..."
python -m venv venv
source venv/bin/activate

echo "3. Installing backend in editable mode..."
cd backend
pip install -e .

echo "Launch backend server..."
./bin/run_ibex_service &
BACKEND_PID=$!   # Get the PID of the backend
cd ..

# Run frontend
cd frontend
echo "Install frontend dependencies..."
npm install

echo "Launch frontend server..."
npm run start &
FRONTEND_PID=$!  # Get the PID of the frontend
cd ..

# Wait for both processes to finish
wait $BACKEND_PID $FRONTEND_PID