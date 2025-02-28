import { IDSDataSelected } from './ids';
import { CheckedNodeIds, CustomTreeData } from './tree';
import { DataFormPlot } from './plot';

interface BaseConfiguration {
  name: string;
  url?: string;
  saved?: boolean;
  dataIDS: IDSDataSelected[];
  lastLocalDataSetSelected?: string;
  lastURIInput?: string;
  checkedNodes: CheckedNodeIds[];
}
export interface Configuration extends BaseConfiguration {
  customDataTree: CustomTreeData[];
  dataFormPlot?: DataFormPlot;
}

export interface ConfigForm {
  name: string;
}
