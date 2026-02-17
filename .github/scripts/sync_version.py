#!/usr/bin/env python3
"""
Sync frontend package.json version with backend version.

Usage:
    python sync_version.py <backend_dir> <frontend_dir>
"""

import sys
import json
from pathlib import Path


def get_backend_version(backend_dir):
    """Get version from backend package."""
    sys.path.insert(0, str(backend_dir))
    try:
        import ibex
        return ibex.__version__
    except ImportError as e:
        print(f"Error: Could not import ibex from {backend_dir}: {e}", file=sys.stderr)
        sys.exit(1)


def update_frontend_version(frontend_dir, version):
    """Update version in frontend package.json."""
    package_json_path = Path(frontend_dir) / 'package.json'
    
    if not package_json_path.exists():
        print(f"Error: package.json not found at {package_json_path}", file=sys.stderr)
        sys.exit(1)
    
    # Read package.json
    with open(package_json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Update version
    old_version = data.get('version', 'unknown')
    data['version'] = version
    
    # Write back with proper formatting
    with open(package_json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')  # Ensure newline at end of file
    
    print(f"Updated frontend version: {old_version} → {version}")
    return True


def main():
    if len(sys.argv) != 3:
        print("Usage: python sync_version.py <backend_dir> <frontend_dir>", file=sys.stderr)
        sys.exit(1)
    
    backend_dir = Path(sys.argv[1]).resolve()
    frontend_dir = Path(sys.argv[2]).resolve()
    
    if not backend_dir.exists():
        print(f"Error: Backend directory not found: {backend_dir}", file=sys.stderr)
        sys.exit(1)
    
    if not frontend_dir.exists():
        print(f"Error: Frontend directory not found: {frontend_dir}", file=sys.stderr)
        sys.exit(1)
    
    print(f"Backend directory: {backend_dir}")
    print(f"Frontend directory: {frontend_dir}")
    
    version = get_backend_version(backend_dir)
    print(f"Backend version: {version}")
    
    if update_frontend_version(frontend_dir, version):
        print("Version sync completed successfully")
        sys.exit(0)
    else:
        print("Version sync failed", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
