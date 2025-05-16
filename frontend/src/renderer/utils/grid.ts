import { Axis, Coordinates, DataGridPlot } from "../types";
import { generateUuid } from "./uuid";

export function findBestSlot(
  layouts: DataGridPlot[],
  itemWidth: number,
  totalCols: number
): number {
  const columnHeights = new Array(totalCols).fill(0);

  layouts.forEach(({ x, y, w, h }) => {
    for (let i = x; i < x + w; i++) {
      columnHeights[i] = Math.max(columnHeights[i], y + h);
    }
  });

  let minY = Infinity;
  let bestX = 0;

  for (let x = 0; x <= totalCols - itemWidth; x++) {
    const maxHeightInRange = Math.max(...columnHeights.slice(x, x + itemWidth));
    if (maxHeightInRange < minY) {
      minY = maxHeightInRange;
      bestX = x;
    }
  }

  return bestX;
}

export const generateNewGrid = (
  title: string,
  xCoordinates: Coordinates[],
  xAxis: Axis,
  yAxis: Axis,
  layouts: DataGridPlot[],
  y2Axis?: Axis,
): DataGridPlot => {
  const cols = 12;
  const x = findBestSlot(layouts, 6, cols);
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
    x: x,
    y: Infinity,
    w: 6,
    h: 12,
  };
};
