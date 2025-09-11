.. _`Benchmarking IBEX`:

===================
Benchmarking IBEX
===================

IBEX integrates with the `airspeed velocity
<https://asv.readthedocs.io/en/stable/index.html>`_ ``asv`` package for benchmarking.

IBEX benchmarks
---------------------------

IBEX benchmarks are stored in the ``benchmarks`` folder in the git repository. We can
currently distinguish only one type of benchmarks:

Endpoint benchmarks
    These benchmarks measure the response time for each of the implemented endpoints.

Running benchmarks (quick)
--------------------------

The benchmarks can be executed in an existing IBEX development installation by running the following command:

.. code-block:: console

    $ asv run --python=same --quick

.. note:: ``asv`` has to be installed for this to work, see https://asv.readthedocs.io/en/stable/installing.html


All benchmarks will be executed once in the active Python environment.
The advantage of executing all benchmarks once is that the process will be completed relatively quickly.
However, the disadvantage is that ``asv`` will be unable to gather statistics (variance) of the run times,
resulting in all timings being reported as ±0ms in the output.

Upon removing the ``--quick`` argument, each benchmark will be executed multiple times by ``asv``.
While this will increase the execution time, it will provide more accurate statistics.

Running benchmarks (advanced)
-----------------------------

Running benchmarks quickly, as explained in the previous section, is great during
development and for comparing the performance of IBEX. However,
``asv`` can also track the performance of benchmarks over various commits of IBEX.
Unfortunately, setting this up is somewhat more complex.

Setup advanced benchmarking
'''''''''''''''''''''''''''

First, some background on how ``asv`` tracks performance: it creates an isolated virtual
environment (using the ``virtualenv`` package) and installs IBEX for each commit that
will be benchmarked.

Deciding which commits to benchmark
'''''''''''''''''''''''''''''''''''

By default, ``asv run`` executes the benchmarks on two commits: the most recent commit on the ``main`` branch and the most recent commit on the ``develop`` branch.
If this behavior is desired, this section may be skipped, and the next one can be followed instead.

If customization of the benchmarked commits is required, ``asv run`` supports the specification of a commit range using the syntax: ``asv run <range>``.
The ``<range>`` argument is forwarded to ``git rev-list``, and all commits returned by ``git`` within that range will be benchmarked.
See the `asv documentation for some examples
<https://asv.readthedocs.io/en/stable/using.html#benchmarking>`_.

.. caution::

    Some arguments may result in lots of commits to benchmark, for example ``asv run
    <branchname>`` will run benchmarks not only for the last commit in the branch, but
    also for every ancestor commit of it. Use ``asv run <branchname>^!`` to run a
    benchmark on just the last commit of the branch.

    It is therefore highly adviced to check the output ``git rev-list`` before running
    ``asv run``.

.. seealso:: https://asv.readthedocs.io/en/stable/commands.html#asv-run

Running benchmarks in CI
'''''''''''''''''''''''''''''''''''

Directory ``backend/ci`` contains script ``run_benchmarks.sh`` which loads necessary modules and
performs benchmarking for last commit of current branch and creates comparison
summary against ``master`` and ``develop`` branches benchmark results.


Viewing the results
'''''''''''''''''''

See https://asv.readthedocs.io/en/stable/using.html#viewing-the-results.





