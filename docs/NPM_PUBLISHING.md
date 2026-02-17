# Publishing IBEX Frontend to npm

This guide explains how to publish the IBEX frontend package to npm.

## Prerequisites

Before publishing to npm, ensure you have:

1. An npm account (create one at https://www.npmjs.com/signup)
2. npm CLI installed (comes with Node.js)
3. Proper permissions to publish the `ibex` package name (or use a scoped package like `@yourorg/ibex`)

## Setup

### 1. Login to npm

```bash
npm login
```

Enter your npm username, password, and email when prompted.

### 2. Verify Your Login

```bash
npm whoami
```

This should display your npm username.

## Publishing Process

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Update Version Number

Before publishing, update the version in `package.json` following [Semantic Versioning](https://semver.org/):

- **Patch release** (bug fixes): `npm version patch` (e.g., 0.1.0 → 0.1.1)
- **Minor release** (new features): `npm version minor` (e.g., 0.1.0 → 0.2.0)
- **Major release** (breaking changes): `npm version major` (e.g., 0.1.0 → 1.0.0)

Or manually edit the version in `package.json`.

### 3. Build the Package

```bash
npm run package
```

This creates the electron-forge packaged application in the `out/` directory.

### 4. Test the Package Locally (Optional but Recommended)

Before publishing, test the package locally:

```bash
npm pack
```

This creates a `.tgz` file that you can install in another project to test:

```bash
# In another directory
npm install /path/to/ibex-0.1.0.tgz
```

### 5. Publish to npm

**Important**: The package build artifacts (`.webpack/` and `out/`) must exist before publishing. 
If you haven't run `npm run package` yet, the publish will fail.

#### Quick Method (Recommended)

Use the combined script that builds and publishes:

```bash
npm run publish:npm
```

This runs `npm run package` followed by `npm publish`.

#### Manual Method

Or do it step by step:

**For Public Package**

```bash
npm publish
```

**For Scoped Package**

If you're using a scoped package (e.g., `@yourorg/ibex`), update the name in `package.json` first:

```json
{
  "name": "@yourorg/ibex",
  ...
}
```

Then publish:

```bash
npm publish --access public
```

### 6. Verify Publication

Check that your package is published:

```bash
npm view ibex
```

Or visit: https://www.npmjs.com/package/ibex

## Important Considerations

### Package Name Availability

The package name `ibex` may already be taken on npm. If so, you have these options:

1. **Use a scoped package**: `@yourorg/ibex` or `@deepakmaroo/ibex`
2. **Choose a different name**: `ibex-electron`, `imas-ibex`, etc.

To check if a name is available:

```bash
npm view <package-name>
```

If the package doesn't exist, the name is available.

### License

The package is licensed under LGPL-3.0. Ensure this is acceptable for your use case and that all dependencies are compatible with this license.

### Files Included in Package

The `.npmignore` file controls which files are included. The following are included by default:
- `.webpack/` - Webpack bundled files
- `out/` - Packaged electron application
- `resources/` - Application resources
- `README.md` - Documentation
- `LICENSE.txt` - License file

## Automated Publishing (Optional)

You can set up automated publishing using GitHub Actions. Create `.github/workflows/npm-publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - name: Install dependencies
        run: |
          cd frontend
          npm install
      - name: Build package
        run: |
          cd frontend
          npm run package
      - name: Publish to npm
        run: |
          cd frontend
          npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

To use this workflow:
1. Generate an npm access token from https://www.npmjs.com/settings/<your-username>/tokens (replace `<your-username>` with your actual npm username)
2. Add it as a secret named `NPM_TOKEN` in your GitHub repository settings

## Updating the Package

When you need to publish updates:

1. Make your changes
2. Update the version: `npm version patch/minor/major`
3. Build: `npm run package`
4. Publish: `npm publish`

## Troubleshooting

### "Package name already exists"

Use a scoped package or different name as described above.

### "You do not have permission to publish"

Ensure you're logged in with `npm whoami` and have permissions for the package name.

### "Package.json version already published"

You need to increment the version number before publishing again.

## Additional Resources

- [npm Documentation](https://docs.npmjs.com/)
- [Semantic Versioning](https://semver.org/)
- [npm Publishing Guide](https://docs.npmjs.com/creating-and-publishing-unscoped-public-packages)
- [Electron Forge Documentation](https://www.electronforge.io/)
