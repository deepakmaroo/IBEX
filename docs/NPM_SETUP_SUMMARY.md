# NPM Package Publishing Setup - Summary

This document summarizes the changes made to enable publishing the IBEX frontend as an npm package.

## Changes Made

### 1. Updated `frontend/package.json`

**Key changes:**
- **Version**: Changed from `"dev"` to `"0.1.0"` for semantic versioning
- **Description**: Updated to properly describe IBEX
- **License**: Changed from `"MIT"` to `"LGPL-3.0"` to match the root LICENSE.txt
- **Keywords**: Added relevant keywords for npm search: electron, imas, data-visualization, hdf5, etc.
- **Repository**: Added GitHub repository URLs
- **Files**: Specified which files to include in the published package (`.webpack`, `out`, `resources`, etc.)
- **publishConfig**: Added npm registry configuration for public access

### 2. Created `frontend/.npmignore`

This file excludes unnecessary files from the npm package:
- Source TypeScript files (since the package is bundled)
- Config files (webpack, eslint, prettier, etc.)
- Development files (node_modules, logs, tests)
- Environment files (.env files)

### 3. Created `docs/NPM_PUBLISHING.md`

A comprehensive guide that covers:
- Prerequisites for publishing
- Step-by-step publishing process
- Version management with semantic versioning
- How to test the package locally
- Troubleshooting common issues
- Setting up automated publishing with GitHub Actions

### 4. Created `.github/workflows/npm-publish.yml`

A GitHub Actions workflow that:
- Triggers on release creation or manual dispatch
- Installs dependencies and lints the code
- Builds the package
- Publishes to npm using NPM_TOKEN secret
- Creates a summary with installation instructions

### 5. Updated Documentation

- **README.md**: Added "Publishing" section with link to NPM publishing guide
- **frontend/README.md**: Added tip box with link to NPM publishing guide

### 6. Added Convenience Script

Added `publish:npm` script to `package.json` that automatically builds and publishes in one command.

## How to Publish

### Option 1: Quick Publish (Recommended)

1. Navigate to the frontend directory: `cd frontend`
2. Login to npm: `npm login`
3. Update version: `npm version patch/minor/major`
4. Build and publish: `npm run publish:npm`

### Option 2: Manual Publishing

1. Navigate to the frontend directory: `cd frontend`
2. Login to npm: `npm login`
3. Update version: `npm version patch/minor/major`
4. Build: `npm run package`
5. Publish: `npm publish`

See [docs/NPM_PUBLISHING.md](NPM_PUBLISHING.md) for detailed instructions.

### Option 3: Automated Publishing (Recommended)

1. Generate an npm access token at https://www.npmjs.com/settings/<your-username>/tokens (replace `<your-username>` with your actual npm username)
2. Add it as a secret named `NPM_TOKEN` in GitHub repository settings
3. Create a new release on GitHub
4. The workflow will automatically publish to npm

## Important Notes

### Package Name Availability

The package name `ibex` may already be taken on npm. If publishing fails due to name conflict, you have two options:

1. **Use a scoped package**: Update `name` in package.json to `@yourorg/ibex` or `@deepakmaroo/ibex`
2. **Choose a different name**: e.g., `ibex-electron`, `imas-ibex`, etc.

Check availability with: `npm view <package-name>`

### License Considerations

The package is licensed under LGPL-3.0. Ensure:
- All dependencies are compatible with LGPL-3.0
- Users understand the license requirements
- Attribution is properly maintained

### What Gets Published

The npm package will include:
- `.webpack/` - Bundled webpack output
- `out/` - Electron packaged application
- `resources/` - Application resources
- `README.md` - Documentation
- `LICENSE.txt` - License file

Source TypeScript files and configuration files are excluded.

## Testing

To test what will be included in the package:

```bash
cd frontend
npm pack --dry-run
```

To create a local tarball for testing:

```bash
cd frontend
npm pack
```

Then install it in another project:

```bash
npm install /path/to/ibex-0.1.0.tgz
```

## Next Steps

1. **Test the build**: Run `npm run package` in the frontend directory
2. **Verify package contents**: Use `npm pack --dry-run` to see what will be published
3. **Check package name**: Verify `ibex` is available on npm, or update to a scoped package
4. **Set up npm token**: If using automated publishing, add NPM_TOKEN to GitHub secrets
5. **Publish**: Follow the manual or automated publishing process

## Resources

- [NPM Publishing Guide](NPM_PUBLISHING.md) - Detailed publishing instructions
- [npm Documentation](https://docs.npmjs.com/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions npm Publishing](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages)
