import { IDSData } from './ids';
import { CustomTreeData } from './tree';

export interface Configuration {
  name: string;
  url?: string;
  saved?: boolean;
  dataIDS: IDSData[];
  lastLocalDataSetSelected?: string;
  lastURIInput?: string;
  customDataTree: CustomTreeData[];
}

export interface ConfigForm {
  name: string;
}
