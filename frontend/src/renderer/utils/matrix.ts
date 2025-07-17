export function isMatrix(value: number[][] | string[][] | number[] | string[]): value is number[][] | string[][] {
  return Array.isArray(value[0]);
}
