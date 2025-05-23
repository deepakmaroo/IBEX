.. _`How to launch ibex tools`:

===================
How to launch ibex?
===================

The IBEX backend is structured into three distinct layers, each represented by a corresponding directory within the ibex Python package:

Development mode
-----------------------------------

* Open a terminal.
* Clone the repository (ssh://git@git.iter.org/imex/ibex.git) 
* Run the following commands : 

.. code-block:: bash

   cd ibex
   git checkout develop
   ./launch.sh

Production mode
-----------------------------------

* Extract the zip file.
* Open the folder.
* In the “./resources” directory, create a configuration file named config.json with the following variables. By default, this file will be created with these values:

.. code-block:: bash

  {
    "API_URL": "http://localhost:8000"
  }

* Launch the ibex executable (Make sure your backend is running):

.. code-block:: bash

  ./ibex