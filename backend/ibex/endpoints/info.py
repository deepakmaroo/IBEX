"""Endpoints returning informations about server"""

from fastapi import APIRouter  # type: ignore

from ibex.core import ibex_service
from ibex.core.utils import DownsamplingMethods
from ibex import __version__

router = APIRouter()


@router.get("/info/version/")
@ibex_service.measure_execution_time
async def version() -> dict:
    """
    IBEX endpoint. Returns backend version.

    Response JSON is constructed as follows:
    {
        "version": <IBEX_version (str)>
    }
    """
    res = {"version": str(__version__)}
    return res


@router.get("/info/downsampling_methods/")
@ibex_service.measure_execution_time
async def downsampling_methods() -> dict:
    """
    IBEX endpoint. Returns list of available downsampling methods to be passed to /data/plot_data endpoint as query argument.

    Response JSON is constructed as follows:
    {
        "downsampling_methods": [
        {
          "name": <method_name>,
          "description": <method_description>
        },
        ...
        ]
    }
    """

    methods = [{"name": val.value["name"], "description": val.value["description"]} for val in DownsamplingMethods]
    res = {"downsampling_methods": methods}
    return res
