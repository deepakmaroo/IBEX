export function normalizeIndices(uri: string): string {
  return uri.replace(/\[\d+\]/g, '[:]');
}

export const getDefaultUri = (url: string): string => {
  // Replace the last occurrence of '[:]' with '[0]'
  return url.replace(/\[:\]/g, '[0]');
};

/**
 * @description Update the index of a field in a target string.
 * @param target The target string to update.
 * @param fieldName The name of the field to update. ex: "ion" or "profiles_1d"
 * @param index The new index to set. Can be a number or ':'.
 * @returns The updated target string.
 */
export function updateIndexFieldName(
  target: string,
  fieldName: string,
  index: number | ':', // index can now be ':' or a number
): string {
  const regex = new RegExp(`(${fieldName})\\[(\\d+|:)\\]`);
  const newTarget = target.replace(regex, `${fieldName}[${index}]`);

  return newTarget;
}

/**
 * @description Get the last indexed field in a target string.
 * @param target The target string to search.
 * @returns The name of the last indexed field(index can now be ':' or a number), or null if none found.
 */
export function getLastIndexedField(target: string): string | null {
  const matches = [...target.matchAll(/([a-zA-Z0-9_]+)\[(\d+|:)\]/g)];
  if (matches.length === 0) return null;
  return matches[matches.length - 1][1]; // Last indexed field name is captured
}
