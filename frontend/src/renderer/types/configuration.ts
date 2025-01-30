import { IDSDataSelected } from './ids';
import { CustomTreeData } from './tree';

export interface Configuration {
  name: string;
  url?: string;
  saved?: boolean;
  dataIDS: IDSDataSelected[];
  lastLocalDataSetSelected?: string;
  lastURIInput?: string;
  customDataTree: CustomTreeData[];
}

export interface ConfigForm {
  name: string;
}
