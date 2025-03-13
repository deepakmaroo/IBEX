import { NodeInfoResponse } from "src/renderer/types";

export const fetchNodeInfos = async (nodeUri: string): Promise<NodeInfoResponse> => {
  const response = await fetch(
    `${window.env.API_URL}/ids_info/node_info/?uri=${encodeURIComponent(nodeUri)}`,
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