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

# Search for 2 open ports, one for webpack renderer and one for webpack logger
# The range 49152–65535 contains dynamic or private ports.
# This range is used for private or customized services, for temporary purposes, and for automatic allocation of ephemeral ports.
found_ports=()

# https://unix.stackexchange.com/questions/55913/whats-the-easiest-way-to-find-an-unused-local-port
found_ports[0]=`comm -23 <(seq 49152 65535 | sort) <(ss -Htan | awk '{print $4}' | cut -d':' -f2 | sort -u) | shuf | head -n 1`
found_ports[1]=`comm -23 <(seq 49152 65535 | sort) <(ss -Htan | awk '{print $4}' | cut -d':' -f2 | sort -u) | shuf | head -n 1`

echo "Setting WEBPACK_RENDERER PORT = ${found_ports[0]}"
echo "Setting WEBPACK_LOGGER PORT = ${found_ports[1]}"

cat > ".env" <<EOF
# Webpack renderer port
WEBPACK_PORT=${found_ports[0]}

# Webpack logger port
LOGGER_PORT=${found_ports[1]}
EOF

npm install

echo "6. Launch frontend server..."
npm run start &
FRONTEND_PID=$!
cd "$SCRIPT_DIR"

# Wait for both processes to finish
wait $BACKEND_PID $FRONTEND_PID