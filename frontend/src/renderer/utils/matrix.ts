export function isMatrix(value: number[][][] | number[][] | number[] ): boolean {
  if (Array.isArray(value)) {
    if (value.length === 0) return false; // Empty array is not a matrix
    const firstElement = value[0];
    if (Array.isArray(firstElement)) {
      return firstElement.every(row => Array.isArray(row)); // Check if all elements are arrays
    }
  }
  return false; // Not a matrix
}

export const getFirstArrayValueFromShape = (
  value: number[][][] | number[][] | number[],
  shape: number[]
): number[] => {
  if (shape.length === 0) return [];

  if (shape.length === 1) {
    // Handle 1D arrays
    return Array.isArray(value) && value.length > 0 ? value[0] as number[] : [];
  }

  if (shape.length === 2) {
    // Handle 2D arrays
    return Array.isArray(value) && Array.isArray(value[0]) ? value[0][0] as number[] : [];
  }

  // For higher dimensions (3D or more), return the first element of the first array
  return Array.isArray(value) ? value[0] as number[] : [];
}