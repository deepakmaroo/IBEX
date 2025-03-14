import { Data } from 'plotly.js';

export interface SimplePlotlyProps {
  title: string;
  yAxisName: string;
  yAxis2Name?: string;
  data: Data[];
  isStatic?: boolean;
  handleDragStatic?: () => void;
  handleDeleteGrid?: () => void;
  handleUpdateGrid?: () => void;
}

export interface DataPlot {
  uuid: string;
  static: boolean;
  plot: Data[];
  yAxisName: string;
  title: string;
}

export type DataPlotly = Data & {
  uriY: string;
};
