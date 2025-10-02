import { AxisData, Coordinates } from '../types';
import * as tf from '@tensorflow/tfjs';

export const getFirstArrayValueFromShape = (
  value: AxisData,
  shape: number[],
): number[] => {
  if (shape.length === 0) return [];

  if (shape.length === 1) {
    // Handle 1D arrays
    return Array.isArray(value) && value.length > 0 ? (value as number[]) : [];
  }

  if (shape.length === 2) {
    // Handle 2D arrays
    return Array.isArray(value) && Array.isArray(value[0])
      ? (value[0] as number[])
      : [];
  }

  // For higher dimensions (3D or more), return the first element of the first array
  return Array.isArray(value) &&
    Array.isArray(value[0]) &&
    Array.isArray(value[0][0])
    ? (value[0][0] as number[])
    : [];
};

export const getArrayValueFromDependance = (
  coordinates: Coordinates[],
  axeIndexWanted: number,
) => {
  const wantedCoordinate: Coordinates = coordinates.find(
    (coord) => coord.axeIndex === axeIndexWanted,
  );
  if (!wantedCoordinate.coordinates.length) {
    // get first array value when having no dependance
    return getFirstArrayValueFromShape(
      wantedCoordinate.data,
      wantedCoordinate.shape as number[],
    );
  }

  // get sorted valueIndex list (sorted by shape length) to access to data matrix
  const dependances = wantedCoordinate.coordinates;
  const sortedIndexValueDependances: number[] = [];

  let tensor;
  if (wantedCoordinate.shape === 'irregular') {
    // get shape when irregular data
    tensor = tf.tensor(wantedCoordinate.data);
  }

  for (const shapeElement of wantedCoordinate.shape === 'irregular'
    ? tensor.shape
    : wantedCoordinate.shape) {
    const coordDep = coordinates.find(
      (coord_dep) =>
        dependances.includes(coord_dep.name) &&
        coord_dep.shape[coord_dep.shape.length - 1] === shapeElement &&
        !coord_dep.isDimensionCoordinate,
    );
    if (coordDep) {
      sortedIndexValueDependances.push(coordDep.valueIndex);
    }
  }

  // Get wanted coordinate data from dependencies not linked to the dimension
  let coordinateData: (number | string) | AxisData = wantedCoordinate.data;
  for (const vectorIndex of sortedIndexValueDependances) {
    if (Array.isArray(coordinateData)) {
      coordinateData = coordinateData[vectorIndex];
    }
  }

  return coordinateData as string[] | number[];
};

export const is3DMatrix = (shape: number[]): boolean => {
  // A 3D matrix has a shape with at least 3 dimensions
  return shape.length >= 3;
};
