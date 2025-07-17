from typing import List  # type: ignore
from enum import Enum  # type: ignore

from tsdownsample import MinMaxDownsampler, M4Downsampler, LTTBDownsampler, MinMaxLTTBDownsampler

import numpy as np  # type: ignore


def step_downsampling(x, data, n_out, *args, **kwargs):
    step = int(len(data) / n_out)
    if step == 0:
        step = 1
    return data[::step]


def step_average_downsampling(x, data, n_out, *args, **kwargs):
    group_size = len(data) / n_out
    return np.mean(data.reshape(-1, group_size), 1)


class DownsamplingMethods(Enum):
    """
    Enum class representing available downsampling methods.
    STEP and STEP_AVERAGE are implemented directly in ibex code, while MIN_MAX, M4, LTTB and MIN_MAX_LLTB methods are implemented in tsdownsample package (https://github.com/predict-idlab/tsdownsample).
    """

    NONE = {"name": "None", "description": "Downsampling disabled", "function": step_downsampling}
    STEP = {
        "name": "Step",
        "description": "Returns every n-th element. N is calculated basing on desired data size",
        "function": step_average_downsampling,
    }
    STEP_AVERAGE = {
        "name": "Step average",
        "description": "Divides data into bins and return average value of every bin. Bin size is calculated basing on desired data size",
        "function": step_downsampling,
    }
    MIN_MAX = {"name": "Min-Max", "description": "", "function": MinMaxDownsampler}
    M4 = {"name": "M4", "description": "", "function": M4Downsampler}
    LTTB = {"name": "LTTB", "description": "", "function": LTTBDownsampler}
    MIN_MAX_LTTB = {"name": "Min-Max LTTB", "description": "", "function": MinMaxLTTBDownsampler}

    @classmethod
    def _missing_(cls, name):
        if name is None:
            return cls.NONE
        for method in cls:
            if method.value["name"].lower() == name.lower():
                return method
        raise ValueError(f"Downsampling method: {name} is not recognised by IBEX backend")


def _downsample_data(self, data: List, target_size: int, method=None):
    """

    :param data: data to be down-sampled
    :param target_size: desired size of data (in elements per dimension)
    :param method:
    """
    if method is None or method == DownsamplingMethods.NONE:
        return data

    if not isinstance(data, list):
        return data

    # if data elements are lists, return merged down-sampled lists
    if isinstance(data[0], list):
        return [self._downsample_data(elem, target_size, method) for elem in data]

    downsampling_function = DownsamplingMethods(method).value["function"]

    s_ds = downsampling_function().downsample(np.asarray(data), n_out=target_size)
    return (np.asarray(data)[s_ds]).tolist()
