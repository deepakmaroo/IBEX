import { URIData } from './ids';
import { CheckedNodeURI, CustomTreeData } from './tree';
import { DataFormPlot } from './plot';

export interface BaseConfiguration {
  name: string;
  dataURI: URIData[];
  lastLocalDataSetSelected?: string;
  lastURIInput?: string;
  checkedNodes: CheckedNodeURI[];
}
export interface Configuration extends BaseConfiguration {
  url?: string;
  saved?: boolean;
  customDataTree: CustomTreeData[];
  dataFormPlot?: DataFormPlot;
}

export interface ConfigForm {
  name: string;
}
