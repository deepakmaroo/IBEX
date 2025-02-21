export interface DataPlot {
  nameNode: string;
  valueX: number[];
  valueY: number[];
}

export interface DataFormPlot {
  titleForm?: string;
  titleAxisY?: string;
  titleAxisX?: string;
  dataPlot?: FormPlot[];
}

export interface FormPlot {
  nameNode?: string;
  axeX?: string;
  axeY?: string;
}