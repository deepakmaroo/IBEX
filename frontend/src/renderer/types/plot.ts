import { Data } from 'plotly.js';
import { Layout } from 'react-grid-layout';

export interface SimplePlotlyProps {
  title: string;
  yAxisName: string;
  yAxis2Name?: string;
  data: Data[];
  isStatic?: boolean;
  handleDragStatic?: () => void;
  handleDeleteGrid?: () => void;
}

export interface DataGridPlot extends Layout {
  static: boolean;
  plot: Data[];
  yAxisName: string;
  title: string;
}

export type DataPlotly = Data & {
  uriY: string;
};
