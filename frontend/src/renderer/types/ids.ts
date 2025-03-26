export type URIData = {
  name: string;
  uri: string;
  uriColor: string;
};

export type IdsResponse = {
  name: string;
  occurrences: number[];
}

export type DataIdsResponse = {
  idses: IdsResponse[];
};