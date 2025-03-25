import { DataPlot, DataPlotly } from '../types';
import { generateUuid } from './uuid';

export async function plotData(
  xData: number[],
  yData: number[],
  name: string,
  yAxisName: string,
  dataPlot: DataPlot[],
  uriY: string,
): Promise<DataPlot> {
  const plot: DataPlotly = {
    x: xData,
    y: yData,
    mode: 'lines',
    name: name,
    uriY: uriY,
  };

  let newUuid = generateUuid();

  while (dataPlot.find((plot) => plot.uuid === newUuid)) {
    newUuid = generateUuid();
  }

  const newDataPlot: DataPlot = {
    uuid: newUuid,
    static: false,
    plot: [plot],
    title: name,
    yAxisName: yAxisName,
  };

  return newDataPlot;
}
