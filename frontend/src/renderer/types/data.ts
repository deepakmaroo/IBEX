import { AxisData } from './plot';

export type PlotCoordinatesResponse = {
  name: string;
  target: string;
  unit: string;
  value: AxisData;
  downsampled_shape: number[];
  shape: number[] | 'irregular';
  coordinates: string[];
  ndim: number;
  path: string;
  description: string;
  isDimensionCoordinate?: boolean;
};

export type PlotDataResponse = {
  data: {
    name: string;
    unit: string;
    value: AxisData;
    downsampled_shape: number[];
    downsampled_method?: string;
    shape: number[] | 'irregular';
    ndim: number;
    path: string;
    description: string;
    coordinates: PlotCoordinatesResponse[];
  };
};

export type FieldValueResponse = {
  value: number | number[];
};

export type DownsamplingMethodsResponse = {
  downsampling_methods: [
    {
      name: string;
      description: string;
    },
  ];
};

export type ArraySummaryResponse = {
  shape: number[];
  min: number;
  max: number;
  mean: number;
  standard_deviation: number;
  message?: string;
};

export type InfoVersionResponse = {
  version: string;
};
