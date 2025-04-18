# Ibex

## Installation

## Requirements

Load required modules

```commandline
module load IMASPy IDStools
```

## Development setup

```commandline
python -m venv venv
. venv/bin/activate

# in `backend` directory
pip install -e . # editable mode allows changes to have instant impact
```

## Development run
```commandline
./bin/run_ibex_service

>...
>Uvicorn running on http://127.0.0.1:<port_number>
>...

# start firefox and open localhost:<port_number>/docs to explore endpoints

# you can also specify port number when running service
./bin/run_ibex_service -p 8000
```

## Documentation build
```commandline
. venv/bin/activate
pip install -U sphinx sphinx-autosummary-accessors sphinx_immaterial

make -C docs html
```

## Testing
```commandline
python -m pytest tests/ #make sure to run pythest with python -m. Otherwise it won't see installed fastapi packages
```
