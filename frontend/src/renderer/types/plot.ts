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

};

export interface DataGridPlot extends Layout {
  title: string;
  static: boolean;
  plot: DataPlotly[];
  xAxisName: string;
  
  yAxisName: string;
  y2AxisName?: string;
  y3AxisName?: string;
  y4AxisName?: string;

  yUnit: string;
  y2Unit?: string;
  y3Unit?: string;
  y4Unit?: string;

}