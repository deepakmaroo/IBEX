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

export interface BaseDataPlotly {
  nodeUri: string;
  labelUri: string;
  yaxis?: string;
}

export type DataPlotly = BaseDataPlotly &
  Data & {
    x: (string | number)[];
    y: (string | number)[];
    path?: string;
    dimensions?: number;
    shape?: number[];
    unit?: string;
    description?: string;
  };

export interface BaseDataGridPlot {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  xAxisName: string;
  yAxisName: string;
  y2AxisName?: string;
  yUnit: string;
  y2Unit?: string;
}

export interface DataGridPlot extends Layout, BaseDataGridPlot {
  static: boolean;
  plot: DataPlotly[];
  isEditing: boolean;
}

export interface DataGridPlotToSave extends BaseDataGridPlot {
  plot: BaseDataPlotly[];
}
