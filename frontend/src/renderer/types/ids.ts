type IDSData = {
  name: string;
  uri: string;
};

export type IDSDataSelected = IDSData & {
  occurrenceIndex?: number;
};

export type IDSDataLoaded = IDSData & {
  occurrences: number[];

};
