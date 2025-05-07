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
    value: number[];
    shape: number[];
    ndim: number;
    path: string;
    description: string;
    coordinates: PlotCoordinatesResponse[];
  };
};

export type FieldValueResponse = {
  value: number | number[];
}
