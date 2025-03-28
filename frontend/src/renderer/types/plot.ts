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

export interface DataGridPlot extends Layout {
  static: boolean;
  plot: Data[];
  xAxisName: string;
  yAxisName: string;
  y2AxisName?: string;
  title: string;
  xAxisPath: string;
  yAxisPath: string;
  y2AxisPath?: string;
}

export type DataPlotly = Data & {
  uriY: string;
};
