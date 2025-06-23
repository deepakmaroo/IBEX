#!/bin/bash

set -e


# Find and print 3 random unused TCP ports in the dynamic/private range (49152–65535)

#!/bin/bash

get_free_ports() {
  local num_ports=3
  local port_range_start=49152
  local port_range_end=65535


  # Generate the full list of candidate ports
  local all_ports
  all_ports=$(seq "$port_range_start" "$port_range_end")
  local used_ports
  used_ports=$(ss -tan | awk 'NR > 1 { gsub(".*:", "", $4); print $4 }' | sort -u)

  
  # Get free ports using comm on seq and ss output
  local free_ports
  free_ports=$(comm -23 <(echo "$all_ports") <(echo "$used_ports"))

  # Randomize, pick top N, print space-separated ports with newline at end
  echo "$free_ports" | shuf | head -n "$num_ports" | paste -sd ' ' -
  echo
}

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

read -r -a found_ports < <(get_free_ports)
echo "Selected free ports: ${found_ports[@]}"
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