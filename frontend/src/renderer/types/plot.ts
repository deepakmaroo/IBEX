import { Data } from 'plotly.js';
import { Layout } from 'react-grid-layout';

export interface Axis {
  name: string;
  unit: string;
  path?: string;
}

export type AxisData =
  | (number | string)[][][]
  | (number | string)[][]
  | (number | string)[];

export interface BaseCoordinates {
  path: string;
  target: string;
  valueIndex: number;
}

export interface Coordinates extends BaseCoordinates {
  name: string;
  downsampled_shape: number[];
  shape: number[] | 'irregular';
  coordinates: string[];
  data: AxisData;
  axeIndex: number;
  unit?: string;
}

export interface BaseDataPlotly {
  nodeUri: string;
  labelUri: string;
  yaxis?: string;
}

export type DataPlotly = BaseDataPlotly &
  Data & {
    x: (string | number)[];
    y: (string | number)[];
    yData: AxisData;
    path?: string;
    dimensions?: number;
    shape?: number[];
    description?: string;
  };

export interface BaseDataGridPlot {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  isTitleOverwritten: boolean;
  xAxisData?: Axis;
  yAxisData?: Axis;
  y2AxisData?: Axis;
}

export interface DataGridPlot extends Layout, BaseDataGridPlot {
  plot: DataPlotly[];
  isEditing: boolean;
  coordinates?: Coordinates[];
  downsampled_method?: string;
}

export interface DataGridPlotToSave extends BaseDataGridPlot {
  plot: BaseDataPlotly[];
  coordinates: BaseCoordinates[];
}
