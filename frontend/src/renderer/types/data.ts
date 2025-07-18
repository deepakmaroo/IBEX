export type PlotCoordinatesResponse = {
  name: string;
  target: string;
  unit: string;
  value: number[] | number[][];
  shape: number[];
  ndim: number;
  path: string;
  description: string;
};

export type PlotDataResponse = {
  data: {
    name: string;
    unit: string;
    value: number[] | string[] | number | string;
    shape: number[];
    ndim: number;
    path: string;
    description: string;
    coordinates: PlotCoordinatesResponse[];
  };
};

export type FieldValueResponse = {
  value: number | number[];
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
