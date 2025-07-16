export function normalizeIndices(uri: string): string {
  return uri.replace(/\[\d+\]/g, '[:]');
}

export const getDefaultUri = (url: string): string => {
  // Replace the last occurrence of '[:]' with '[0]'
  return url.replace(/\[:\]/g, '[0]');
};
