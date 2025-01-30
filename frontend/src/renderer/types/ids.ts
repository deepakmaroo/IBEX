export type IDSData = {
  name: string;
  uri: string;
  fullUri: string;
  occurrence?: number;
};

export type IDSDataLoaded = IDSData & {
  occurrences: number[];

};
