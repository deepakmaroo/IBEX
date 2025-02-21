import { IDSDataSelected } from './ids';
import { CheckedNodeIds, CustomTreeData } from './tree';
import { DataFormPlot } from './plot';

export interface Configuration {
  name: string;
  url?: string;
  saved?: boolean;
  dataIDS: IDSDataSelected[];
  lastLocalDataSetSelected?: string;
  lastURIInput?: string;
  customDataTree: CustomTreeData[];
  checkedNodes: CheckedNodeIds[];
  dataFormPlot?: DataFormPlot;
}

export interface ConfigForm {
  name: string;
}
