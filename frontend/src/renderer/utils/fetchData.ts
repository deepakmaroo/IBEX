import { FieldValueResponse, NodeInfoResponse } from '../types';

export const fetchNodeInfos = async (
  nodeUri: string,
  showErrorBars: boolean,
): Promise<NodeInfoResponse> => {
  const response = await fetch(
    `${window.env.API_URL}/ids_info/node_info/?uri=${encodeURIComponent(nodeUri)}&show_error_bars=${showErrorBars}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch IDS data');
  }

  const data = await response.json();
  return data;
};

export const fetchFieldValue = async (
  uri: string,
): Promise<FieldValueResponse> => {
  try {
    const response = await fetch(
      `${window.env.API_URL}/data/field_value/?uri=${encodeURIComponent(uri)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch IDS data');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
};
