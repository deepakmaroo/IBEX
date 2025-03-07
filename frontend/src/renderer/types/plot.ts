import { Data } from "plotly.js";

export interface DataPlot {
  nameNode: string;
  valueX: number[];
  valueY: number[];
}

export interface DataFormPlot {
  titleForm?: string;
  titleAxisY?: string;
  titleAxisX?: string;
  coordinates?: CoordinatePlot[];
}

export interface CoordinatePlot {
  nameNode?: string;
  axeX?: string;
  axeY?: string;
}

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