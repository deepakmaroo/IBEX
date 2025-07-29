import numpy as np
from ibex.core.utils import downsample_data
from ibex.core.utils import DownsamplingMethods


def test_step_downsampling():
    data = np.asarray(list(range(10)))
    _, downsampled_data = downsample_data(data, 5, method=DownsamplingMethods.STEP)
    assert downsampled_data.tolist() == list(range(0, 10, 2))


def test_step_downsampling_with_x_axis():
    x_axis = np.asarray(range(10))
    data = np.asarray(range(10))

    downsampled_x, downsampled_data = downsample_data(data, 5, method=DownsamplingMethods.STEP, x=x_axis)

    assert downsampled_data.tolist() == list(range(0, 10, 2))
    assert downsampled_x.tolist() == list(range(0, 10, 2))
