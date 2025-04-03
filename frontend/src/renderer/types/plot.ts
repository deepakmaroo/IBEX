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
  nodeUri:string;
  unit: string;
};

export interface DataGridPlot extends Layout {
  title: string;
  static: boolean;
  plot: DataPlotly[];
  xAxisName: string;
  
  yAxisName: string;
  y2AxisName?: string;

  yUnit: string;
  y2Unit?: string;
}