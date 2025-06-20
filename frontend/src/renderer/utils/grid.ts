import { Axis, Coordinates, DataGridPlot } from '../types';
import { generateUuid } from './uuid';

export const findNextAvailableY = (existingPlots: DataGridPlot[]): number => {
  if (existingPlots.length === 0) return 0;

  // Trouver la position la plus basse (y + h)
  const maxY = Math.max(...existingPlots.map((plot) => plot.y + plot.h));
  return maxY;
};

export const generateNewGrid = (
  xCoordinates: Coordinates[],
  xAxis: Axis,
  yAxis: Axis,
  existingPlots: DataGridPlot[],
  y2Axis?: Axis,
): DataGridPlot => {
  return {
    title: '',
    i: generateUuid(),
    isEditing: true,
    static: true,
    plot: [],
    xAxis: xAxis,
    yAxis: yAxis,
    y2Axis: y2Axis,
    coordinates: xCoordinates,
    x: 0,
    y: findNextAvailableY(existingPlots),
    w: 6,
    h: 12,
  };
};
