# IBEX

IBEX (IMAS variaBles EXplorer) is a general purpose graphical tool for exploring the content of IMAS structured data. It can display quantities as 1D or 2D plots (possibly slicing through higher dimensionality datasets). It is expected to replace [IMASViz](https://github.com/IRFM/IMASViz) (which is not maintained anymore) and go beyond.

> [!NOTE]
> This project is under active development, important changes may occur including in the backend endpoint API. 


[Frontend readme](frontend/README.md)

[Backend readme](backend/README.md)

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+

### Installation Options

#### Option 1: Install from Package Managers (Recommended for Users)

**Install Backend:**
```bash
pip install ibex
```

**Install Frontend:**
```bash
npm install -g @ibex/frontend
```

**Run IBEX:**
```bash
# Terminal 1: Start backend
run_ibex_service -p 8000

# Terminal 2: Start frontend (in a new terminal)
ibex-frontend --api-url http://localhost:8000
```

#### Option 2: Build from Source

```bash
git clone <ibex_repo>
cd ibex/backend
python -m venv ibex_venv
source ibex_venv/bin/activate
pip install .

cd ../frontend
npm install
npm run package
```

**Run IBEX:**
```bash
./out/ibex-linux-x64/ibex
```

### NPM Package Usage

The IBEX frontend is available as a separate npm package, allowing for flexible deployment:

- **Quick Installation:** `npm install -g @ibex/frontend`
- **Version Management:** Independent versioning from backend
- **Flexible Deployment:** Desktop app, web integration, or custom setups
- **Easy Updates:** `npm update -g @ibex/frontend`

For detailed information about using the npm package, see [NPM Package Guide](NPM_PACKAGE_GUIDE.md).

## Developer Installation

### installation on SDCC

```commandline
    git clone <ibex_repo>
    cd ibex
    
    # this script packs frontend and prepares site-packages with backend
    ./install.sh

    # test if it runs successfully
    ./frontend/out/ibex-linux-x64/ibex
```

### Run IBEX on SDCC

```commandline
    # first you have to install ibex as shown in step "Central installation on SDCC"
    ./<ibex_repo>/launch.sh
```

### Development run

```commandline
    git clone <ibex_repo>
    cd ibex
    
    # this script creates venv, installs python package in editable mode and runs fronend
    ./launch-dev.sh
```
