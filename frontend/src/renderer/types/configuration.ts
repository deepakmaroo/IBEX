import { IDSData } from './ids';

export interface Configuration {
  name: string;
  url?: string;
  saved?: boolean;
  dataIDS: IDSData[];
  lastLocalDataSetSelected?: string;
  lastURIInput?: string;
}

export interface ConfigForm {
  name: string;
}
