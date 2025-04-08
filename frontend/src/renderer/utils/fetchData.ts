import {
  DataIdsResponse,
  NodeInfoResponse,
  PlotDataResponse,
  SearchNodeResponse,
} from '../types';

/**
 * Fetch the node information
 * @param nodeUri
 * @param showErrorBars
 *
 * @returns
 * @type {NodeInfoResponse}
 *
 */
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

/**
 * Fetch the find paths
 * @param uri
 * @param value
 * @param showErrorBars
 *
 * @returns
 * @type {SearchNodeResponse}
 */
export const fetchFindPaths = async (
  uri: string,
  value: string,
  showErrorBars: boolean,
): Promise<SearchNodeResponse> => {
  try {
    const response = await fetch(
      `${window.env.API_URL}/ids_info/find_paths/?uri=${encodeURIComponent(uri)}&searched_node=${encodeURIComponent(value)}&show_error_bars=${showErrorBars}`,
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

/**
 * Fetch the data ids
 * @param uri
 *
 * @returns
 * @type {DataIdsResponse}
 */
export const fetchDataIds = async (uri: string): Promise<DataIdsResponse> => {
  try {
    const response = await fetch(
      `${window.env.API_URL}/data_entry/list_idses/?uri=${encodeURIComponent(uri)}`,
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

/**
 * Fetch the plot data
 * @param uri
 *
 * @returns
 * @type {PlotDataResponse}
 */
export const fetchDataPlot = async (uri: string): Promise<PlotDataResponse> => {
  try {
    const response = await fetch(
      `${window.env.API_URL}/data/plot_data/?uri=${encodeURIComponent(uri)}`,
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
