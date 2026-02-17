#!/bin/bash

# IBEX Quick Start Script
# This script demonstrates how to use IBEX when installed via package managers
# (pip for backend, npm for frontend)

set -e

echo "========================================="
echo "IBEX Quick Start"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is installed
echo "Checking installations..."
if ! command -v run_ibex_service &> /dev/null; then
    echo -e "${RED}Backend not found!${NC}"
    echo "Install with: pip install ibex"
    exit 1
fi
echo -e "${GREEN}✓ Backend installed${NC}"

# Check if frontend is installed
if ! command -v ibex-frontend &> /dev/null; then
    echo -e "${RED}Frontend not found!${NC}"
    echo "Install with: npm install -g @ibex/frontend"
    exit 1
fi
echo -e "${GREEN}✓ Frontend installed${NC}"

echo ""

# Find free port for backend
find_free_port() {
    local port_range_start=49152
    local port_range_end=65535
    
    # Check if ss command is available, fallback to netstat
    local check_cmd
    if command -v ss &> /dev/null; then
        check_cmd="ss -tuln"
    elif command -v netstat &> /dev/null; then
        check_cmd="netstat -tuln"
    else
        echo "Error: Neither 'ss' nor 'netstat' command found" >&2
        exit 1
    fi
    
    while true; do
        port=$((RANDOM % (port_range_end - port_range_start + 1) + port_range_start))
        if ! $check_cmd | grep -q ":$port "; then
            echo "$port"
            return
        fi
    done
}

# Get free port
BACKEND_PORT=$(find_free_port)

echo "Configuration:"
echo "  Backend Port: $BACKEND_PORT"
echo ""

# Start backend
echo "Starting backend on port $BACKEND_PORT..."
run_ibex_service -p "$BACKEND_PORT" &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend to start..."
sleep 3

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}Failed to start backend${NC}"
    exit 1
fi

# Test backend health
if curl -s "http://localhost:$BACKEND_PORT/info" > /dev/null; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${YELLOW}⚠ Backend may not be ready yet${NC}"
fi

echo ""

# Start frontend
echo "Starting frontend..."
ibex-frontend --api-url "http://localhost:$BACKEND_PORT" &
FRONTEND_PID=$!

echo ""
echo "========================================="
echo -e "${GREEN}IBEX is now running!${NC}"
echo "========================================="
echo ""
echo "Backend:  http://localhost:$BACKEND_PORT"
echo "Frontend: Electron desktop application"
echo ""
echo "Press Ctrl+C to stop both services"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "Stopping services..."
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    echo "Stopped"
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Wait for processes
wait $FRONTEND_PID
cleanup
