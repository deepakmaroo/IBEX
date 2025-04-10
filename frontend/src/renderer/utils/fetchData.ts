import {
  DataIdsResponse,
  FormDbEntries,
  NodeInfoResponse,
  PlotDataResponse,
  SearchNodeResponse,
  URDataEntriesResponse,
  URIExistsResponse,
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
    `/ids_info/node_info/?uri=${encodeURIComponent(nodeUri)}&show_error_bars=${showErrorBars}`,
  );

export const fetchFindPaths = (
  uri: string,
  value: string,
  showErrorBars: boolean,
) =>
  fetchFromApi<SearchNodeResponse>(
    `/ids_info/find_paths/?uri=${encodeURIComponent(uri)}&searched_node=${encodeURIComponent(value)}&show_error_bars=${showErrorBars}`,
  );

export const fetchDataIds = (uri: string) =>
  fetchFromApi<DataIdsResponse>(
    `/data_entry/list_idses/?uri=${encodeURIComponent(uri)}`,
  );

export const fetchDataPlot = (uri: string) =>
  fetchFromApi<PlotDataResponse>(
    `/data/plot_data/?uri=${encodeURIComponent(uri)}`,
  );

export const fetchURIExists = (uri: string) =>
  fetchFromApi<URIExistsResponse>(
    `/ids_info/uri_exists/?uri=${encodeURIComponent(uri)}`,
  );

export const fetchDataEntries = (dataEntriesParameters: FormDbEntries) =>
  fetchFromApi<URDataEntriesResponse>(
    `/data_entry/available_entries/?user=${dataEntriesParameters.user}&backend=${dataEntriesParameters.backend}&database=${dataEntriesParameters.database}&version=${dataEntriesParameters.version}`,
  );
