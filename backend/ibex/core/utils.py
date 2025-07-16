from typing import List
from ibex.core.ibex_service import DownsamplingMethods
from tsdownsample import MinMaxDownsampler, M4Downsampler, LTTBDownsampler, MinMaxLTTBDownsampler

import numpy as np  # type: ignore


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

    else:
        if method == DownsamplingMethods.STEP:
            step = int(len(data) / target_size)
            if step == 0:
                step = 1
            return data[::step]
        elif method == DownsamplingMethods.STEP_AVERAGE:
            # def average(self, arr, n):
            group_size = len(data) / target_size
            return np.mean(data.reshape(-1, group_size), 1)
        else:
            downsamplers = {
                DownsamplingMethods.MIN_MAX: MinMaxDownsampler,
                DownsamplingMethods.M4: M4Downsampler,
                DownsamplingMethods.LTTB: LTTBDownsampler,
                DownsamplingMethods.MIN_MAX_LTTB: MinMaxLTTBDownsampler,
            }

            s_ds = downsamplers[method]().downsample(np.asarray(data), n_out=target_size)
            return (np.asarray(data)[s_ds]).tolist()
