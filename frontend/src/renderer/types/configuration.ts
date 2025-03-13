import { URIData } from './ids';
import { CheckedNodeByURI, CustomTreeData } from './tree';
import { DataFormPlot } from './plot';

export interface BaseConfiguration {
  name: string;
  dataURI: URIData[];
  lastLocalDataSetSelected?: string;
  lastURIInput?: string;
  checkedNodeByURI: CheckedNodeByURI[];
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
