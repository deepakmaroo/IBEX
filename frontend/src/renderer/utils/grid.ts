import { Axis, Coordinates, DataGridPlot } from '../types';
import { generateUuid } from './uuid';

export const generateNewGrid = (
  title: string,
  xCoordinates: Coordinates[],
  xAxis: Axis,
  yAxis: Axis,
  y2Axis?: Axis,
): DataGridPlot => {
  return {
    title: title,
    i: generateUuid(),
    static: false,
    plot: [],
    xAxis: xAxis,
    yAxis: yAxis,
    y2Axis: y2Axis,
    isEditing: true,
    coordinates: xCoordinates,
    x: 0,
    y: Infinity,
    w: 6,
    h: 12,
  };
};
