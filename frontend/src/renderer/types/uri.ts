export type URIData = {
  name: string;
  uri: string;
  uriColor?: string;
};

export type URITreeNodeData = {
  name: string;
  uri: string;
  shape?: number[];
}

export type URIExistsResponse = {
  exists: boolean;
};

export type URDataEntriesResponse = {
  entries: string[];
};

export interface FormDbEntries {
  user: string;
  backend: string;
  database: string;
  version: string;
}
