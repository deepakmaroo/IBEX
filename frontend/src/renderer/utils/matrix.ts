export function isMatrix(value: number[] | number[][]): value is number[][] {
  return Array.isArray(value[0]);
}