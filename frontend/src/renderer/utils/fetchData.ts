import {
  DataIdsResponse,
  FieldValueResponse,
  FormDbEntries,
  NodeInfoResponse,
  PlotDataResponse,
  SearchNodeResponse,
  URDataEntriesResponse,
  URIExistsResponse,
} from '../types';

/**
 * Retrieves the API configuration.
 */
const getConfig = async () => {
  try {
    const config = await window.api.getConfig();
    if (!config) throw new Error('Failed to load configuration');
    return config;
  } catch (error) {
    console.error('Error fetching config:', error);
    throw error;
  }
};

/**
 * Handles API errors.
 * You can also report the error to a monitoring service here (e.g., Sentry).
 */
const handleError = (error: unknown, context: string) => {
  console.error(`Error in ${context}:`, error);
  throw error; // Optional: You could return null/undefined instead
};

/**
 * Generic GET request to the API.
 */
const fetchFromApi = async <T>(endpoint: string): Promise<T> => {
  try {
    const config = await getConfig();
    const response = await fetch(`${config.API_URL}${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch data');
    }

    return response.json();
  } catch (error) {
    handleError(error, `fetchFromApi(${endpoint})`);
  }
};

// ---- Specific API calls ----

/**
 * Fetches information about a given node.
 */
export const fetchNodeInfos = async (
  nodeUri: string,
  showErrorBars: boolean,
) => {
  return fetchFromApi<NodeInfoResponse>(
    `/ids_info/node_info/?uri=${encodeURIComponent(nodeUri)}&show_error_bars=${showErrorBars}`,
  );
};

/**
 * Finds matching node paths based on a search value.
 */
export const fetchFindPaths = async (
  uri: string,
  value: string,
  showErrorBars: boolean,
) => {
  return fetchFromApi<SearchNodeResponse>(
    `/ids_info/find_paths/?uri=${encodeURIComponent(uri)}&searched_node=${encodeURIComponent(value)}&show_error_bars=${showErrorBars}`,
  );
};

/**
 * Retrieves plot data for a given URI.
 */
export const fetchDataPlot = async (uri: string) => {
  return fetchFromApi<PlotDataResponse>(
    `/data/plot_data/?uri=${encodeURIComponent(uri)}`,
  );
};

/**
 * Retrieves field values for a given URI.
 */
export const fetchFieldValue = async (uri: string) => {
  return fetchFromApi<FieldValueResponse>(
    `/data/field_value/?uri=${encodeURIComponent(uri)}`,
  );
};

/**
 * Lists all available IDS IDs for a given URI.
 */
export const fetchDataIds = async (uri: string) => {
  return fetchFromApi<DataIdsResponse>(
    `/data_entry/list_idses/?uri=${encodeURIComponent(uri)}`,
  );
};

/**
 * Checks whether a specific URI exists.
 */
export const fetchURIExists = async (uri: string) => {
  return fetchFromApi<URIExistsResponse>(
    `/data_entry/exists/?uri=${encodeURIComponent(uri)}`,
  );
};

/**
 * Retrieves available entries for a user/database configuration.
 */
export const fetchDataEntries = async (
  dataEntriesParameters: FormDbEntries,
) => {
  return fetchFromApi<URDataEntriesResponse>(
    `/data_entry/available_entries/?user=${dataEntriesParameters.user}&backend=${dataEntriesParameters.backend}&database=${dataEntriesParameters.database}&version=${dataEntriesParameters.version}`,
  );
};
