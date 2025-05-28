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

When you have an existing IBEX development installation, you can run the benchmarks like this:

.. code-block:: console

    $ asv run --python=same --quick

.. note:: You need to have ``asv`` installed for this to work, see https://asv.readthedocs.io/en/stable/installing.html

This will execute all benchmarks once in your active python environment. The upside of
executing all benchmarks once is that this won't take very long. The downside is that
``asv`` won't be able to gather statistics (variance) of the run times, so you'll note
that in the output all timings are reported ``±0ms``.

When you remove the ``--quick`` argument, ``asv`` will execute each benchmark multiple
times. This will take longer to execute, but it also gives better statistics.

Running benchmarks (advanced)
-----------------------------

Running benchmarks quickly, as explained in the previous section, is great during
development and for comparing the performance of IBEX. However,
``asv`` can also track the performance of benchmarks over various commits of IBEX.
Unfortunately this is a bit more tricky to set up.

Setup advanced benchmarking
'''''''''''''''''''''''''''

First, some background on how ``asv`` tracks performance: it creates an isolated virtual
environment (using the ``virtualenv`` package) and installs IBEX for each commit that
will be benchmarked.

Deciding which commits to benchmark
'''''''''''''''''''''''''''''''''''

``asv run`` by default runs the benchmarks on two commits: the last commit on the
``main`` branch and the last commit on the ``develop`` branch. If this is what you want,
then you may skip this section and continue to the next.

If you want to customize which commits are benchmarked, then ``asv run`` allows you to
specify which commits you want to benchmark: ``asv run <range>``. The ``<range>``
argument is passed to ``git rev-list``, and all commits returned by ``git`` will be
benchmarked. See the `asv documentation for some examples
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





