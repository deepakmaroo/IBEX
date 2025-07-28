.. _`Adding new downsampling method`:

==============================
Adding new downsampling method
==============================

Introduction
-------------

IBEX employs downsampling techniques to reduce the volume of data transmitted between the backend and frontend,
particularly when the number of data points exceeds the display resolution of the plot.
This optimization minimizes bandwidth usage and improves rendering performance without significantly impacting visual fidelity.

DownsamplingMethods Enum
------------------------

``ibex.core.utils.DownsamplingMethods`` is an ``Enum`` that defines the available downsampling strategies.
To make a new method available, a developer must extend the enum by adding a new entry that includes the method's name,
a descriptive summary, and a reference to the corresponding function object implementing the downsampling logic.

Index based methods
-------------------

In the simplest scenario, a downsampling method returns an index or a list of indices that can be applied to the original dataset to reduce its size to a desired number of points. The method should follow the signature:
``method_name(data: IDSNumericArray, n_out, *args, **kwargs)`` where ``data`` is an ``IDSNumericArray`` containing the input data, and ``n_out`` specifies the target number of output samples.
The function must return a valid index object suitable for slicing the data array. For example, returning ``slice(None, None, 2)`` will effectively reduce the number of data points by half when applied as:
``data[method_name(...)]``

Advanced methods
----------------

If a new downsampling method requires a different set of arguments or returns a value other than an index (e.g., a reduced data array instead of an index or slice), it must be integrated differently.
The primary entry point for downsampling logic is the ``ibex.core.utils.downsample_data`` function.
To support advanced methods with custom behavior, the function's workflow should be extended by adding a conditional branch (e.g., an if statement) that handles the specific method appropriately.
This ensures the method is invoked correctly and its output is compatible with the rest of the data processing pipeline.

.. code-block:: python
   def downsample_data(data: List, target_size: int, method: DownsamplingMethods | None = None, x=None):
      ...
      if DownsamplingMethods(method).value["name"] == "<new method name>":
         ...
         downsampled_data = ...
         return downsampled_data
