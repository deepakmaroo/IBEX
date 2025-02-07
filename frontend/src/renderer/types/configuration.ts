import { IDSDataSelected } from './ids';
import { CheckedNodeIds, CustomTreeData } from './tree';

export interface Configuration {
  name: string;
  url?: string;
  saved?: boolean;
  dataIDS: IDSDataSelected[];
  lastLocalDataSetSelected?: string;
  lastURIInput?: string;
  customDataTree: CustomTreeData[];
  checkedNodes: CheckedNodeIds[]
}

export interface ConfigForm {
  name: string;
}
