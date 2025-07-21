from typing import List  # type: ignore
from enum import Enum  # type: ignore

from tsdownsample import MinMaxDownsampler, M4Downsampler, LTTBDownsampler, MinMaxLTTBDownsampler  # type: ignore

import numpy as np  # type: ignore


def step_downsampling(data, n_out, *args, **kwargs):
    """
    Takes data list as input, and returns list of indices to be used for downsampling.
    Utilizes step method returning every n-th index, where step is calculated as follows: step = len(data) / n_out
    :param data: data to be down-sampled
    :param n_out: desired size of data after downsampling
    :param *args: unused argument
    :param **kwargs: unused argument
    """
    step = int(len(data) / n_out)
    if step == 0:
        step = 1
    return list(range(0, len(data), step))


def step_average_downsampling(data, n_out, *args, **kwargs):
    """
    Takes data list as input, and returns list of indices to be used for downsampling.
    Utilizes step-average method. Divides data into bind and counts average value of every bin.
    :param data: data to be down-sampled
    :param n_out: desired size of data after downsampling
    :param *args: unused argument
    :param **kwargs: unused argument
    """
    return [range(0, len(data))]  # not implemented

    group_size = len(data) / n_out
    return np.mean(data.reshape(-1, int(group_size)), 1)


class DownsamplingMethods(Enum):
    """
    Enum class representing available downsampling methods.
    STEP and STEP_AVERAGE are implemented directly in ibex code, while MIN_MAX, M4, LTTB and MIN_MAX_LLTB methods are implemented in tsdownsample package (https://github.com/predict-idlab/tsdownsample).
    """

    NONE = {"name": "None", "description": "Downsampling disabled", "function": step_downsampling}
    STEP = {
        "name": "Step",
        "description": "Returns every n-th element. N is calculated basing on desired data size",
        "function": step_downsampling,
    }
    STEP_AVERAGE = {
        "name": "Step average",
        "description": "Divides data into bins and return average value of every bin. Bin size is calculated basing on desired data size",
        "function": step_average_downsampling,
    }
    MIN_MAX = {"name": "Min-Max", "description": "", "function": MinMaxDownsampler().downsample}
    M4 = {"name": "M4", "description": "", "function": M4Downsampler().downsample}
    LTTB = {"name": "LTTB", "description": "", "function": LTTBDownsampler().downsample}
    MIN_MAX_LTTB = {"name": "Min-Max LTTB", "description": "", "function": MinMaxLTTBDownsampler().downsample}

    @classmethod
    def _missing_(cls, name):
        if name is None:
            return cls.NONE
        for method in cls:
            if method.value["name"].lower() == name.lower():
                return method
        raise ValueError(f"Downsampling method: {name} is not recognised by IBEX backend")


def downsample_data(data: List, target_size: int, method: DownsamplingMethods | None = None, x=None):
    """
    Downsamples list of values
    :param data: data to be down-sampled
    :param target_size: desired size of data (in elements per dimension)
    :param method: Downsampling method. One of DownsamplingMethods (Enum) possible values or None
    :param x: x-axis values to be downsampled
    """
    if method is None or method == DownsamplingMethods.NONE:
        return x, data

    if not isinstance(data, list):
        return x, data

    # if data elements are lists, return merged down-sampled lists
    if isinstance(data[0], list):
        return [downsample_data(elem, target_size, method) for elem in data]

    downsampling_function = DownsamplingMethods(method).value["function"]

    s_ds = downsampling_function(np.asarray(data), n_out=target_size)

    if x is not None:
        return (np.asarray(x)[s_ds]).tolist(), (np.asarray(data)[s_ds]).tolist()

    return x, (np.asarray(data)[s_ds]).tolist()
