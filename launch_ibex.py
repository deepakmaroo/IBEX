#!/usr/bin/env python3
"""
IBEX Launcher - Python Integration Example

This script demonstrates how Python backend users can launch
both the backend and frontend together, regardless of how they
are installed (npm package or source).
"""

import subprocess
import sys
import shutil
import time
import socket
import signal
import os
from pathlib import Path


def find_free_port(start=49152, end=65535):
    """Find a free port in the given range."""
    for port in range(start, end):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('', port))
                return port
            except OSError:
                continue
    raise RuntimeError("No free ports available")


def check_command(command):
    """Check if a command is available."""
    return shutil.which(command) is not None


def check_backend_ready(port, timeout=10):
    """Check if backend is responding."""
    import urllib.request
    import urllib.error
    
    url = f"http://localhost:{port}/info"
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        try:
            with urllib.request.urlopen(url, timeout=2) as response:
                if response.status == 200:
                    return True
        except (urllib.error.URLError, ConnectionRefusedError):
            time.sleep(0.5)
    
    return False


class IBEXLauncher:
    """Launch and manage IBEX backend and frontend."""
    
    def __init__(self):
        self.backend_proc = None
        self.frontend_proc = None
        self.backend_port = None
        
    def start_backend(self, port=None):
        """Start the IBEX backend service."""
        if not check_command('run_ibex_service'):
            print("Error: Backend not found. Install with: pip install ibex")
            return False
        
        if port is None:
            port = find_free_port()
        
        self.backend_port = port
        
        print(f"Starting backend on port {port}...")
        self.backend_proc = subprocess.Popen(
            ['run_ibex_service', '-p', str(port)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        
        # Wait for backend to be ready
        print("Waiting for backend to start...")
        if check_backend_ready(port):
            print(f"✓ Backend is running at http://localhost:{port}")
            return True
        else:
            print("⚠ Backend may not be ready yet")
            return False
    
    def start_frontend(self):
        """Start the IBEX frontend."""
        if not self.backend_port:
            print("Error: Backend must be started first")
            return False
        
        # Check if frontend is installed via npm
        if check_command('ibex-frontend'):
            print("Starting frontend from npm package...")
            self.frontend_proc = subprocess.Popen(
                ['ibex-frontend', '--api-url', f'http://localhost:{self.backend_port}'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
        else:
            # Try to find frontend in source directory
            frontend_path = Path(__file__).parent / 'frontend' / 'out' / 'ibex-linux-x64' / 'ibex'
            if frontend_path.exists():
                print("Starting frontend from source build...")
                # Update config
                config_dir = Path.home() / '.config' / 'ibex'
                config_dir.mkdir(parents=True, exist_ok=True)
                config_file = config_dir / 'config.json'
                
                import json
                config = {
                    'API_URL': f'http://localhost:{self.backend_port}',
                    'WEBPACK_PORT': find_free_port(),
                    'LOGGER_PORT': find_free_port(),
                }
                with open(config_file, 'w') as f:
                    json.dump(config, f, indent=2)
                
                self.frontend_proc = subprocess.Popen(
                    [str(frontend_path)],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                )
            else:
                print("Error: Frontend not found.")
                print("Install with: npm install -g @ibex/frontend")
                print(f"Or build from source in: {Path(__file__).parent / 'frontend'}")
                return False
        
        print("✓ Frontend started")
        return True
    
    def stop(self):
        """Stop both services."""
        print("\nStopping services...")
        
        if self.frontend_proc:
            self.frontend_proc.terminate()
            try:
                self.frontend_proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.frontend_proc.kill()
        
        if self.backend_proc:
            self.backend_proc.terminate()
            try:
                self.backend_proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.backend_proc.kill()
        
        print("Stopped")
    
    def run(self):
        """Run both services and wait."""
        try:
            if not self.start_backend():
                return 1
            
            if not self.start_frontend():
                self.stop()
                return 1
            
            print("\n" + "=" * 50)
            print("IBEX is now running!")
            print("=" * 50)
            print(f"\nBackend:  http://localhost:{self.backend_port}")
            print("Frontend: Electron desktop application")
            print("\nPress Ctrl+C to stop\n")
            
            # Wait for frontend to exit
            self.frontend_proc.wait()
            
        except KeyboardInterrupt:
            pass
        finally:
            self.stop()
        
        return 0


def main():
    """Main entry point."""
    launcher = IBEXLauncher()
    
    # Handle signals
    def signal_handler(signum, frame):
        launcher.stop()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    return launcher.run()


if __name__ == '__main__':
    sys.exit(main())
