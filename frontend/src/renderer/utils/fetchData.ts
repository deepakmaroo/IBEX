import {
  DataIdsResponse,
  FormDbEntries,
  NodeInfoResponse,
  PlotDataResponse,
  SearchNodeResponse,
  URDataEntriesResponse,
  URIExistsResponse,
} from '../types';

/**
 * Récupère la configuration API.
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
 * Gère les erreurs d'API.
 */
const handleError = (error: unknown, context: string) => {
  console.error(`Error in ${context}:`, error);
  // Ici, tu peux aussi envoyer l'erreur à un service de monitoring (ex: Sentry)
  throw error; // Optionnel : Tu peux choisir de ne pas throw et retourner null/undefined
};

/**
 * Effectue une requête API générique.
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

// ---- Fonctions spécifiques ----
export const fetchNodeInfos = async (
  nodeUri: string,
  showErrorBars: boolean,
) => {
  return fetchFromApi<NodeInfoResponse>(
    `/ids_info/node_info/?uri=${encodeURIComponent(nodeUri)}&show_error_bars=${showErrorBars}`,
  );
};

export const fetchFindPaths = async (
  uri: string,
  value: string,
  showErrorBars: boolean,
) => {
  return fetchFromApi<SearchNodeResponse>(
    `/ids_info/find_paths/?uri=${encodeURIComponent(uri)}&searched_node=${encodeURIComponent(value)}&show_error_bars=${showErrorBars}`,
  );
};

export const fetchDataIds = async (uri: string) => {
  return fetchFromApi<DataIdsResponse>(
    `/data_entry/list_idses/?uri=${encodeURIComponent(uri)}`,
  );
};

export const fetchDataPlot = async (uri: string) => {
  return fetchFromApi<PlotDataResponse>(
    `/data/plot_data/?uri=${encodeURIComponent(uri)}`,
  );
};

export const fetchURIExists = async (uri: string) => {
  return fetchFromApi<URIExistsResponse>(
    `/data_entry/exists/?uri=${encodeURIComponent(uri)}`,
  );
};

export const fetchDataEntries = async (
  dataEntriesParameters: FormDbEntries,
) => {
  return fetchFromApi<URDataEntriesResponse>(
    `/data_entry/available_entries/?user=${dataEntriesParameters.user}&backend=${dataEntriesParameters.backend}&database=${dataEntriesParameters.database}&version=${dataEntriesParameters.version}`,
  );
};
