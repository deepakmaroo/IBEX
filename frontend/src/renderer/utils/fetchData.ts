import {
  DataIdsResponse,
  NodeInfoResponse,
  PlotDataResponse,
  SearchNodeResponse,
} from '../types';

const getConfig = async () => {
  const config = await window.api.getConfig();
  if (!config) throw new Error('Failed to load configuration');
  return config;
};

const fetchFromApi = async <T>(endpoint: string): Promise<T> => {
  const config = await getConfig();
  const response = await fetch(`${config.API_URL}${endpoint}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch IDS data');
  }

  return response.json();
};

export const fetchNodeInfos = (nodeUri: string, showErrorBars: boolean) =>
  fetchFromApi<NodeInfoResponse>(
    `/ids_info/node_info/?uri=${encodeURIComponent(nodeUri)}&show_error_bars=${showErrorBars}`
  );

export const fetchFindPaths = (uri: string, value: string, showErrorBars: boolean) =>
  fetchFromApi<SearchNodeResponse>(
    `/ids_info/find_paths/?uri=${encodeURIComponent(uri)}&searched_node=${encodeURIComponent(value)}&show_error_bars=${showErrorBars}`
  );

export const fetchDataIds = (uri: string) =>
  fetchFromApi<DataIdsResponse>(`/data_entry/list_idses/?uri=${encodeURIComponent(uri)}`);

export const fetchDataPlot = (uri: string) =>
  fetchFromApi<PlotDataResponse>(`/data/plot_data/?uri=${encodeURIComponent(uri)}`);
