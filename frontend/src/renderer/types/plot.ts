import { Data } from 'plotly.js';
import { Layout } from 'react-grid-layout';

export interface SimplePlotlyProps {
  title: string;
  xAxisName: string;
  yAxisName: string;
  y2AxisName?: string;
  data: Data[];
  isStatic?: boolean;
  handleDragStatic?: () => void;
  handleDeleteGrid?: () => void;
}

export type DataPlotly = Data & {
  nodeUri: string;

};

export interface DataGridPlot extends Layout {
  static: boolean;
  plot: DataPlotly[];
  xAxisName: string;
  yAxisName: string;
  y2AxisName?: string;
  title: string;
  xAxisPath: string;
  yAxisPath: string;
  y2AxisPath?: string;
}