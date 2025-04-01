import { DataGridPlot, DataPlotly } from '../types';
import { generateUuid } from './uuid';

export const generateNewPlot = (
  title: string,
  xAxisName: string,
  yAxisName: string,
  yUnit: string,
  y2AxisName?: string,
  y2Unit?: string,

): DataGridPlot => {
  return {
    title: title,
    i: generateUuid(),
    static: false,
    plot: [],
    xAxisName: xAxisName,
    yAxisName: yAxisName,
    y2AxisName: y2AxisName,
    yUnit: yUnit,
    y2Unit: y2Unit,
    
    //default layout position
    x: 0,
    y: 0,
    w: 6,
    h: 12,
    minH: 12,
    minW: 6,
  };
};

export async function plotData(
  title: string,
  dataPlot: DataGridPlot,
  xData: number[],
  yData: number[],
  nodeUri: string,

  yName: string,
  y2Axis?: boolean,

): Promise<DataGridPlot> {
  const trace: DataPlotly = {
    x: xData,
    y: yData,
    name: yName,
    mode: 'lines',
    nodeUri: nodeUri,
  };



  if (y2Axis) {
    trace.yaxis = 'y2';

    dataPlot = {
      ...dataPlot,
      title: `${title}`,
    };

  } 

  dataPlot.plot.push(trace);

  return dataPlot;
}
