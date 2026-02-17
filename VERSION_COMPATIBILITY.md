# IBEX Frontend/Backend Version Compatibility

## Overview

The IBEX frontend and backend can have independent version numbers since they are distributed as separate packages (npm and pip respectively). This document outlines the versioning strategy and compatibility matrix.

## Versioning Philosophy

### Independent Versions
- **Frontend** (`@ibex/frontend`): Follows [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH)
- **Backend** (`ibex`): Follows [PEP 440](https://www.python.org/dev/peps/pep-0440/) 

Note: Both follow semantic versioning in practice. PEP 440 is compatible with semver for release versions.
For pre-releases, PEP 440 uses format like `1.0.0a1`, `1.0.0b1`, `1.0.0rc1` while npm semver uses `1.0.0-alpha.1`, `1.0.0-beta.1`, `1.0.0-rc.1`.
For consistency, align pre-release naming between packages when possible.

### Version Synchronization (Optional)
- Major releases can be synchronized (e.g., both at 1.0.0, 2.0.0)
- Minor/patch versions can diverge based on needs
- The `install.sh` script syncs frontend version with backend when building

## API Versioning

The backend API should be versioned to maintain compatibility:

```python
# Backend - main.py
app = FastAPI()
v1_router = APIRouter(prefix="/api/v1")
# ... add routes to v1_router
app.include_router(v1_router)
```

```typescript
// Frontend - config
const API_VERSION = 'v1';
const apiUrl = `${baseUrl}/api/${API_VERSION}`;
```

## Compatibility Matrix

| Frontend Version | Backend Version | Status | Notes |
|------------------|-----------------|--------|-------|
| 0.1.x            | 0.1.x           | ✅ Compatible | Initial npm package release |
| 0.2.x            | 0.1.x - 0.2.x   | ✅ Compatible | Backward compatible |
| 1.0.x            | 1.0.x           | ✅ Compatible | Stable API v1 |
| 1.1.x            | 1.0.x - 1.1.x   | ✅ Compatible | New frontend features |
| 2.0.x            | 2.0.x+          | ✅ Compatible | Breaking changes in API v2 |

## Version Update Guidelines

### Frontend Updates

**Patch Release (0.1.0 → 0.1.1)**
- Bug fixes
- Performance improvements
- No API changes
- Compatible with same backend minor version

**Minor Release (0.1.0 → 0.2.0)**
- New features
- New UI components
- Backward compatible API usage
- May use new backend features if available

**Major Release (0.x.x → 1.0.0)**
- Breaking changes
- New API version requirement
- UI/UX overhaul
- May require backend update

### Backend Updates

**Patch Release (0.1.0 → 0.1.1)**
- Bug fixes
- Performance improvements
- No API changes
- All frontend versions compatible

**Minor Release (0.1.0 → 0.2.0)**
- New endpoints
- New features
- Backward compatible API
- Old frontend versions still work

**Major Release (0.x.x → 1.0.0)**
- Breaking API changes
- New API version
- Requires frontend update

## Version Checking

### Frontend Checks Backend Version

The frontend should check backend compatibility on startup:

```typescript
// In frontend startup code
async function checkBackendCompatibility() {
  const response = await fetch(`${apiUrl}/info`);
  const data = await response.json();
  const backendVersion = data.version;
  
  // Parse versions
  const [backendMajor] = backendVersion.split('.');
  const [frontendMajor] = packageJson.version.split('.');
  
  if (backendMajor !== frontendMajor) {
    console.warn(`Version mismatch: Frontend ${frontendMajor}.x needs Backend ${frontendMajor}.x, but got ${backendVersion}`);
    // Show warning to user
  }
}
```

### Backend Reports Version

The backend should expose version information:

```python
# In info endpoint
@router.get("/info")
async def get_info():
    import ibex
    return {
        "version": ibex.__version__,
        "api_version": "v1",
        "name": "IBEX Backend"
    }
```

## Migration Guide

### When Frontend is Updated

1. **Check Release Notes**: Review breaking changes
2. **Update Package**: `npm update -g @ibex/frontend`
3. **Verify Backend**: Ensure backend version is compatible
4. **Test Integration**: Run basic workflows

### When Backend is Updated

1. **Check Release Notes**: Review API changes
2. **Update Package**: `pip install --upgrade ibex`
3. **Restart Service**: `run_ibex_service -p 8000`
4. **Test Frontend**: Verify frontend still connects

### When Both Need Updates

1. **Read Release Notes**: For both packages
2. **Update Backend First**: `pip install --upgrade ibex`
3. **Restart Backend**: Ensure it's running
4. **Update Frontend**: `npm update -g @ibex/frontend`
5. **Test**: Verify full integration

## Deprecation Policy

### API Endpoints

1. **Announce**: Deprecation announced in release notes
2. **Warning Period**: Minimum 2 minor versions
3. **Removal**: Only in major version bumps

Example:
- Version 1.0: Endpoint `/old-api` available
- Version 1.1: Endpoint marked deprecated, works with warning
- Version 1.2: Still available with warning
- Version 2.0: Endpoint removed

### Frontend Features

1. **Announce**: Feature marked as deprecated
2. **Alternative**: New feature introduced
3. **Removal**: In next major version

## Development Workflow

### For Core Developers

When making changes that affect both:

1. **Branch Strategy**:
   ```bash
   # Create branches in both directories
   git checkout -b feature/new-api-endpoint
   # Make backend changes
   cd backend && git add . && git commit -m "Add new endpoint"
   # Make frontend changes  
   cd ../frontend && git add . && git commit -m "Use new endpoint"
   ```

2. **Version Bumps**:
   ```bash
   # Backend
   cd backend && bump2version patch  # or minor/major
   
   # Frontend
   cd frontend && npm version patch  # or minor/major
   ```

3. **Release Together**:
   ```bash
   # Tag release with both versions
   git tag -a v1.2.0 -m "Release frontend 1.2.0 + backend 1.2.0"
   ```

### For Contributors

When contributing to one side:

1. **Document Requirements**: Specify min/max versions needed
2. **Test Compatibility**: Test against multiple versions
3. **Update Docs**: Update compatibility matrix

## Troubleshooting

### Version Mismatch Errors

**Error**: "API version mismatch"

**Solution**:
```bash
# Check versions
npm list -g @ibex/frontend
pip show ibex

# Update as needed
npm update -g @ibex/frontend
pip install --upgrade ibex
```

### Feature Not Available

**Error**: "Endpoint not found"

**Cause**: Frontend too new for backend

**Solution**:
```bash
# Update backend
pip install --upgrade ibex

# Or downgrade frontend
npm install -g @ibex/frontend@1.0.0
```

### Deprecated Warnings

**Warning**: "Using deprecated API"

**Action**:
- Check release notes for migration path
- Update code to use new API
- Plan upgrade to newer version

## Best Practices

1. **Pin Versions in Production**
   ```bash
   # In deployment scripts
   pip install ibex==1.2.3
   npm install -g @ibex/frontend@1.2.3
   ```

2. **Test Before Upgrading**
   ```bash
   # Create test environment
   python -m venv test_env
   source test_env/bin/activate
   pip install ibex==1.3.0  # new version
   # Test before deploying
   ```

3. **Monitor Compatibility**
   ```python
   # In CI/CD pipeline
   def test_compatibility():
       """Test frontend/backend compatibility"""
       # Start backend
       # Run frontend tests
       # Verify API calls succeed
   ```

4. **Document Dependencies**
   ```yaml
   # In deployment config
   services:
     backend:
       image: ibex-backend:1.2.3
     frontend:
       image: ibex-frontend:1.2.3
       depends_on:
         - backend
   ```

## Release Checklist

### Pre-Release

- [ ] Update version numbers
- [ ] Update CHANGELOG.md
- [ ] Update compatibility matrix
- [ ] Run full test suite
- [ ] Test integration
- [ ] Update documentation

### Release

- [ ] Tag release in git
- [ ] Publish backend to PyPI
- [ ] Publish frontend to npm
- [ ] Create GitHub release
- [ ] Announce in release notes

### Post-Release

- [ ] Monitor for issues
- [ ] Update compatibility docs
- [ ] Respond to user feedback
- [ ] Plan next release

## Contact

For questions about versioning:
- GitHub Issues: https://github.com/iterorganization/IBEX/issues
- Documentation: https://github.com/iterorganization/IBEX/docs
