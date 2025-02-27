type IDSData = {
  name: string;
  uri: string;
};

export type IDSDataSelected = IDSData & {
  uriColor: string;
  occurrenceIndex?: number;
};

export type IDSDataLoaded = IDSData & {
  occurrences: number[];

};
