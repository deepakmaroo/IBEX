import { URIData } from './ids';
import { CheckedNodeURI, CustomTreeData } from './tree';
import { DataFormPlot } from './plot';

export interface BaseConfiguration {
  name: string;
  dataURI: URIData[];
  lastLocalDataSetSelected?: string;
  lastURIInput?: string;
  checkedNodes: CheckedNodeURI[];
  dataFormPlot: DataFormPlot[];
}
export interface Configuration extends BaseConfiguration {
  url?: string;
  saved?: boolean;
  customDataTree: CustomTreeData[];
}

export interface ConfigForm {
  name: string;
}
