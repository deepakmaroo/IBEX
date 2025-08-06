import { Data } from 'plotly.js';
import { Layout } from 'react-grid-layout';

export interface Axis {
  name: string;
  unit: string;
  path?: string;
}

export type AxisData = number[][][] | number[][] | number[];

export interface BaseCoordinates {
  target: string;
  valueIndex: number;
}

export interface Coordinates extends BaseCoordinates {
  name: string;
  shape: number[];
  data: number[];
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
  xAxisData?: Axis;
  yAxisData?: Axis;
  y2AxisData?: Axis;
}

export interface DataGridPlot extends Layout, BaseDataGridPlot {
  plot: DataPlotly[];
  isEditing: boolean;
  coordinates?: Coordinates[];
}

export interface DataGridPlotToSave extends BaseDataGridPlot {
  plot: BaseDataPlotly[];
  coordinates: BaseCoordinates[];
}