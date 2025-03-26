import { DataGridPlot, DataPlotly } from '../types';
import { generateUuid } from './uuid';

export async function plotData(
  xData: number[],
  yData: number[],
  name: string,
  xAxisName: string,
  yAxisName: string,
  dataPlot: DataGridPlot[],
  uriY: string,
): Promise<DataGridPlot> {
  const plot: DataPlotly = {
    x: xData,
    y: yData,
    mode: 'lines',
    name: name,
    uriY: uriY,
  };

  let newUuid = generateUuid();

  while (dataPlot.find((plot) => plot.i === newUuid)) {
    newUuid = generateUuid();
  }

  const newDataPlot: DataGridPlot = {
    static: false,
    plot: [plot],
    title: name,
    yAxisName: yAxisName,
    xAxisName: xAxisName,
    x: 0,
    y: 0,
    w: 6,
    h: 12,
    i: newUuid,
    minH: 12, 
    minW: 6
  };

  return newDataPlot;
}
