#!/bin/bash

set -e

echo "Run in development mode..."

# # Run backend
cd backend
echo "Launch backend server..."
./launch_backend.sh &
BACKEND_PID=$!   # Get the PID of the backend
cd ..

# # Copy config.json
# echo "Copy config.json to frontend..."
# cp "./backend/config.json" "./frontend/config.json"

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