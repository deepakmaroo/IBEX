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
port=49152
found_ports=()

while [ ${#found_ports[@]} -lt 2 ]; do
  if [ -n "$(ss -tan4H "sport = $port")" ]; then
    found_ports+=($port)
  fi
  port=$((port+1))
done

echo "Setting \$WEBPACK_RENDERER PORT = ${found_ports[0]}"
echo "Setting \$WEBPACK_LOGGER PORT = ${found_ports[1]}"

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