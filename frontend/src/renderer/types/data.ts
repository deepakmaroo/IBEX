import { AxisData } from './plot';

export type PlotCoordinatesResponse = {
  name: string;
  target: string;
  unit: string;
  value: AxisData;
  shape: number[];
  shape_factors: ShapeFactorResponse[];
  ndim: number;
  path: string;
  description: string;
};

export type ShapeFactorResponse = {
  name: string;
  values_source: string;
};

export type PlotDataResponse = {
  data: {
    name: string;
    unit: string;
    value: AxisData;
    shape: number[] | string;
    shape_factors: ShapeFactorResponse[];
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
