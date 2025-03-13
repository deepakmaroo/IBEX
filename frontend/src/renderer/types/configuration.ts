import { URIData } from './ids';
import { DataPlot } from './plot';
import { CheckedNodeByURI, CustomTreeData } from './tree';

export interface BaseConfiguration {
  name: string;
  dataURI: URIData[];
  lastLocalDataSetSelected?: string;
  lastURIInput?: string;
  checkedNodeByURI: CheckedNodeByURI[];
  dataPlot: DataPlot[];
}
export interface Configuration extends BaseConfiguration {
  url?: string;
  saved?: boolean;
  customDataTree: CustomTreeData[];
}

export interface ConfigForm {
  name: string;
}
