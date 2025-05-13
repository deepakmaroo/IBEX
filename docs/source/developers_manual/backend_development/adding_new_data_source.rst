.. _`Adding new data source`:

======================
Adding new data source
======================

Introduction
-------------

By default, IBEX utilizes IMAS-Python as its primary data source.
However, the architecture supports extensibility via an intermediate abstraction layer,
ibex.core, which allows seamless integration of alternative data frameworks with minimal impact on the higher-level application logic.

To integrate a new data source into IBEX, the following steps should be followed:

#. The DataSourceInterface must be implemented, and the resulting class should be made accessible to the Python interpreter (e.g. by ensuring proper module packaging or configuring the PYTHONPATH).
#. An import statement for the new data source class should be added to :py:class:`~ibex.core.ibex_service` module in order to make it available for use.
#. The line :py:data:`data_source = IMASPythonSource()` from :py:class:`ibex.core.ibex_service` should be modified to instantiate the new data source class.



After these steps are completed, the new data source will be utilized by IBEX in place of the default IMAS-Python.

