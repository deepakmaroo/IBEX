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
  isStatic?: boolean;
  isEdit?: boolean;
  handleDragStatic?: () => void;
  handleDeleteGrid?: () => void;
  handleEditGrid?: () => void;
}

export type DataPlotly = Data & {
  nodeUri: string;
  unit: string;
  x: (string | number)[]; 
  y: (string | number)[];
  yaxis?: string;
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
