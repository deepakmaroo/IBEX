import { AxisData, Coordinates } from '../types';

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
  xCoordinate: Coordinates,
  coordinates: Coordinates[],
) => {
  // X coordinate isn't slidable, so if no dependance we get first array value
  if (!xCoordinate.coordinates.length) {
    return getFirstArrayValueFromShape(
      xCoordinate.data,
      xCoordinate.shape as number[],
    );
  }

  const dependance = xCoordinate.coordinates;
  // Get x coordinate data from the dependency not linked to the dimension
  const indexValueDependance = coordinates.find(
    (coord_dep) =>
      dependance.includes(coord_dep.name) && !coord_dep.isDimensionCoordinate,
  ).valueIndex;
  const returnValue = xCoordinate.data[indexValueDependance] as (
    | string
    | number
  )[];
  return returnValue;
};

export const is3DMatrix = (shape: number[]): boolean => {
  // A 3D matrix has a shape with at least 3 dimensions
  return shape.length >= 3;
};
