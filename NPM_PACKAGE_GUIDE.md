# IBEX Frontend NPM Package Guide

## Overview

The IBEX frontend can be published as an npm package (`@ibex/frontend`) and used in different deployment scenarios. This guide explains the benefits, use cases, and integration patterns with the IBEX backend (installed via pip).

## Why Publish Frontend as NPM Package?

### Benefits

1. **Versioning & Dependency Management**
   - Track frontend versions independently from backend
   - Semantic versioning for frontend releases
   - Easy rollback to previous versions
   - Clear dependency tracking via npm

2. **Easier Distribution**
   - Users can install frontend via `npm install @ibex/frontend`
   - No need to clone repository or build from source
   - Automated CI/CD publishing to npm registry
   - Consistent builds across different environments

3. **Multiple Deployment Options**
   - Desktop application (Electron)
   - Web application (future enhancement)
   - Embedded in other tools
   - Custom integrations

4. **Developer Experience**
   - Better tooling and IDE support
   - Standard npm workflows
   - Reusable components in other projects
   - Clear separation of concerns

5. **Maintenance & Updates**
   - Independent frontend updates
   - Faster iteration cycles
   - Easier contribution process
   - Better testing isolation

## Installation Scenarios

### Scenario 1: Backend Developer (Quick Start)

Install backend via pip and use pre-built frontend:

```bash
# Install backend
pip install ibex

# Install frontend globally
npm install -g @ibex/frontend

# Run services
run_ibex_service -p 8000 &
ibex-frontend
```

### Scenario 2: Full Development Setup

Clone repository for development of both frontend and backend:

```bash
git clone https://github.com/iterorganization/IBEX.git
cd IBEX

# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -e .

# Frontend
cd ../frontend
npm install
npm run start
```

### Scenario 3: Custom Integration

Use frontend package in your own project:

```bash
npm install @ibex/frontend
```

```javascript
// In your project
const { runIbexFrontend } = require('@ibex/frontend');

runIbexFrontend({
  apiUrl: 'http://localhost:8000',
  port: 3000
});
```

### Scenario 4: Production Deployment

Install both via package managers:

```bash
# Server setup
pip install ibex
npm install -g @ibex/frontend

# Create systemd service or docker container
```

## Integration with Backend (pip install)

### Architecture

```
┌─────────────────────────────────────┐
│   IBEX Frontend (npm package)       │
│   - Electron Desktop App            │
│   - React UI Components             │
│   - HTTP Client                     │
└─────────────┬───────────────────────┘
              │ HTTP/REST API
              │ (localhost:8000)
┌─────────────▼───────────────────────┐
│   IBEX Backend (pip package)        │
│   - FastAPI Server                  │
│   - Data Processing                 │
│   - IMAS Integration                │
└─────────────────────────────────────┘
```

### Communication Protocol

The frontend and backend communicate via REST API:

1. **Backend** (FastAPI) exposes endpoints:
   - `/data` - Data retrieval
   - `/data_entry` - Data exploration
   - `/ids_info` - IDS metadata
   - `/info` - System information

2. **Frontend** (Electron/React) consumes API:
   - Configures API URL via `~/.config/ibex/config.json`
   - Makes HTTP requests to backend
   - Renders visualization components

### Configuration

Frontend configuration file: `~/.config/ibex/config.json`

```json
{
  "API_URL": "http://localhost:8000",
  "WEBPACK_PORT": 49152,
  "LOGGER_PORT": 49153
}
```

### Installation Script Integration

The backend package can optionally install the frontend as a post-install step:

**Option A: Recommend npm install**
```python
# In backend setup.py or pyproject.toml
# Add a console script that checks for frontend
def check_frontend():
    """Check if frontend is available"""
    import shutil
    if not shutil.which('ibex-frontend'):
        print("Frontend not found. Install with: npm install -g @ibex/frontend")
```

**Option B: Bundle pre-built frontend**
```python
# Include pre-built frontend in backend package
package_data = {
    'ibex': ['frontend/dist/**/*']
}
```

**Option C: Optional dependency**
```bash
# Users can choose their installation method
pip install ibex[with-frontend]  # Installs with frontend
pip install ibex                  # Backend only
```

## Publishing to NPM

### Prerequisites

1. NPM account with publish permissions
2. Organization scope `@ibex` or choose alternative name

### Publishing Steps

```bash
cd frontend

# Update version
npm version patch  # or minor, major

# Build the package
npm run package

# Test package locally
npm pack
npm install -g ./ibex-frontend-*.tgz

# Publish to npm
npm publish --access public
```

### CI/CD Automation

Add GitHub Actions workflow for automated publishing:

```yaml
# .github/workflows/publish-frontend.yml
name: Publish Frontend to NPM
on:
  release:
    types: [published]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: cd frontend && npm ci
      - run: cd frontend && npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

## Usage Examples

### Example 1: Basic Usage

```bash
# Terminal 1: Start backend
pip install ibex
run_ibex_service -p 8000

# Terminal 2: Start frontend
npm install -g @ibex/frontend
ibex-frontend --api-url http://localhost:8000
```

### Example 2: Docker Deployment

```dockerfile
FROM python:3.11-slim as backend
RUN pip install ibex

FROM node:18-slim as frontend
RUN npm install -g @ibex/frontend

FROM alpine:latest
COPY --from=backend /usr/local/bin/run_ibex_service /usr/local/bin/
COPY --from=frontend /usr/local/bin/ibex-frontend /usr/local/bin/
CMD ["run_ibex_service", "-p", "8000"]
```

### Example 3: Programmatic Usage

```python
# Python script to launch both services
import subprocess
import os

# Start backend
backend_proc = subprocess.Popen(['run_ibex_service', '-p', '8000'])

# Start frontend
frontend_proc = subprocess.Popen(['ibex-frontend'])

try:
    backend_proc.wait()
    frontend_proc.wait()
finally:
    backend_proc.terminate()
    frontend_proc.terminate()
```

## Versioning Strategy

### Independent Versioning

Frontend and backend can have independent version numbers:

- `@ibex/frontend@1.2.3`
- `ibex (pip)@2.1.0`

### Compatibility Matrix

Document compatible versions:

| Frontend Version | Backend Version | Status |
|------------------|-----------------|--------|
| 1.0.x            | 2.0.x - 2.1.x   | ✅ Compatible |
| 1.1.x            | 2.1.x - 2.2.x   | ✅ Compatible |
| 2.0.x            | 3.0.x+          | ✅ Compatible |

### API Versioning

Use API versioning in backend to maintain compatibility:

```python
# Backend
app.include_router(router, prefix="/api/v1")

# Frontend
const API_VERSION = 'v1';
const apiUrl = `${baseUrl}/api/${API_VERSION}`;
```

## Migration Guide

### For Existing Users

If you're currently using IBEX from source:

**Before (monorepo):**
```bash
git clone <ibex_repo>
./install.sh
./launch.sh
```

**After (npm package):**
```bash
pip install ibex
npm install -g @ibex/frontend
run_ibex_service -p 8000 &
ibex-frontend
```

### For Developers

**Before:**
- Clone entire repository
- Install both frontend and backend

**After:**
- Backend developers: `pip install -e .` in backend directory
- Frontend developers: `npm install` in frontend directory
- Both can work independently with mock services

## Best Practices

1. **Version Pinning**: Pin frontend version in deployment scripts
   ```bash
   npm install -g @ibex/frontend@1.2.3
   ```

2. **Configuration Management**: Use environment-specific configs
   ```bash
   cp config.production.json ~/.config/ibex/config.json
   ```

3. **Health Checks**: Frontend should check backend availability
   ```javascript
   async function checkBackend() {
     try {
       const response = await fetch(`${apiUrl}/info`);
       return response.ok;
     } catch (error) {
       console.error('Backend not available');
       return false;
     }
   }
   ```

4. **Error Handling**: Graceful degradation if backend is unavailable

5. **Security**: Use HTTPS in production, configure CORS properly

## Future Enhancements

1. **Web Version**: Bundle frontend as static web app
2. **Backend Integration**: Optional backend package bundling
3. **Plugin System**: Allow frontend extensions via npm
4. **Themes**: Distribute custom themes as npm packages
5. **CLI Tools**: Additional command-line utilities

## Troubleshooting

### Frontend Can't Connect to Backend

```bash
# Check backend is running
curl http://localhost:8000/info

# Check frontend config
cat ~/.config/ibex/config.json

# Update config if needed
echo '{"API_URL": "http://localhost:8000"}' > ~/.config/ibex/config.json
```

### Version Mismatch

```bash
# Check versions
npm list -g @ibex/frontend
pip show ibex

# Update if needed
npm update -g @ibex/frontend
pip install --upgrade ibex
```

### Installation Issues

```bash
# Clear npm cache
npm cache clean --force

# Reinstall
npm uninstall -g @ibex/frontend
npm install -g @ibex/frontend

# Check installation
which ibex-frontend
ibex-frontend --version
```

## Support

- GitHub Issues: https://github.com/iterorganization/IBEX/issues
- Documentation: https://github.com/iterorganization/IBEX/docs
- NPM Package: https://www.npmjs.com/package/@ibex/frontend

## License

LGPL-3.0 - See LICENSE.txt for details
