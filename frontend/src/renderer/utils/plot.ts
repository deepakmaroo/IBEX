import { DataGridPlot, DataPlotly } from '../types';
import { generateUuid } from './uuid';

export const generateNewPlot = (
  title: string,
  xAxisName: string,
  yAxisName: string,
  xAxisPath: string,
  yAxisPath: string,
): DataGridPlot => {
  return {
    i: generateUuid(),
    static: false,
    plot: [],
    title: title,
    xAxisName: xAxisName,
    yAxisName: yAxisName,
    xAxisPath: xAxisPath,
    yAxisPath: yAxisPath,
    x: 0,
    y: 0,
    w: 6,
    h: 12,
    minH: 12,
    minW: 6,
  };
};

export async function plotData(
  dataPlot: DataGridPlot,
  xData: number[],
  yData: number[],
  yName: string,
  yAxisPath: string,
  y2Name?: string,
  y2Data?: number[],
  y2AxisPath?: string,

): Promise<DataGridPlot> {
  const trace1: DataPlotly = {
    x: xData,
    y: yData,
    name: yName,
    nodeUri: yAxisPath,
    // type: 'scatter',
    mode: 'lines',
  };
  dataPlot.plot.push(trace1);



  if (y2Data && y2AxisPath) {
    const trace2: DataPlotly = {
      x: xData,
      y: y2Data,
      name: y2Name,
      yaxis: 'y2',
      // type: 'scatter',
      nodeUri: y2AxisPath,
      mode: 'lines',

    };

    dataPlot = {
      title: `${yName}/${y2Name}`,
      ...dataPlot,
      plot: [...dataPlot.plot, trace2],
      y2AxisName: y2Name,
      y2AxisPath: y2AxisPath,
    };

  } 

  // console.log(dataPlot);

  return dataPlot;
}
