===================
Configuration file
===================

When you save a configuration, a file in the following format will be created. It contains all the data related to your setup. This file allows you to restore the configuration exactly as you left it (charts, grid positions, selected URIs, preferences, etc.).

You can also manually edit the file before loading it—for example, if you want to change a specific URI. (Make sure the URI exists before making any manual changes.)

.. code-block:: bash

  {
    "name": "My configuration",
    "dataURI": [
      {
        "name": "URI-0",
        "uri": "imas:hdf5?user=public;pulse=100001;run=2;database=iterdb;version=3",
        "uriColor": "#95fd57"
      },
      {
        "name": "URI-1",
        "uri": "imas:hdf5?user=public;pulse=100002;run=1;database=iterdb;version=3",
        "uriColor": "#cdb807"
      }
    ],
    "dataPlot": [
      {
        "title": "temperature(eV) / temperature(eV)_URI-0",
        "xAxis": {
          "name": "rho_tor_norm",
          "unit": "-",
          "path": "#core_profiles/profiles_1d[0]/grid/rho_tor_norm"
        },
        "yAxis": { "name": "temperature", "unit": "eV" },
        "i": "518a6871-5033-4c1f-8b69-8f080bcbe6af",
        "x": 2,
        "y": 0,
        "w": 6,
        "h": 12,
        "coordinates": [
          {
            "target": "#core_profiles/profiles_1d[0]/ion[0]",
            "nodeUri": "URI-0#core_profiles:0/profiles_1d[0]/ion[0]/temperature",
            "value": 0
          },
          {
            "target": "#core_profiles/profiles_1d[0]",
            "nodeUri": "URI-0#core_profiles:0/profiles_1d[0]/ion[0]/temperature",
            "value": 0
          }
        ],
        "plot": [
          {
            "nodeUri": "URI-0#core_profiles:0/profiles_1d[0]/ion[0]/temperature",
            "yaxis": "",
            "labelUri": "URI-0"
          }
        ]
      }
    ]
  }
