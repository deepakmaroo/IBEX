import { Data } from 'plotly.js';
import { Layout } from 'react-grid-layout';

export interface SimplePlotlyProps {
  title: string;
  xAxisName: string;
  yAxisName: string;
  y2AxisName?: string;
  data: Data[];
  width: number;
  height: number;
  isStatic: boolean;
}

export type DataPlotly = Data & {
  nodeUri: string;
  x: (string | number)[];
  y: (string | number)[];
  yaxis?: string;
  path?: string;
  dimensions?: number;
  description?: string;
  unit?: string;
};

export interface DataGridPlot extends Layout {
  title: string;
  static: boolean;
  plot: DataPlotly[];
  xAxisName: string;
  isEditing: boolean;
  yAxisName: string;
  y2AxisName?: string;
  yUnit: string;
  y2Unit?: string;
}

export interface DataPlotlyToSave{
  nodeUri: string;
  yaxis?: string;
}
export interface DataGridPlotToSave {
  title: string;
  plot: DataPlotlyToSave[];
  xAxisName: string;
  yAxisName: string;
  y2AxisName?: string;
  yUnit: string;
  y2Unit?: string;
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}
