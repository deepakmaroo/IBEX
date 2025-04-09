import { URIData } from './ids';
import { DataGridPlot } from './plot';
import { CustomTreeData } from './tree';

export interface BaseConfiguration {
  name: string;
  dataURI: URIData[];
  lastLocalDataSetSelected?: string;
  lastURIInput?: string;
  dataPlot: DataGridPlot[];
}
export interface Configuration extends BaseConfiguration {
  checkedNodeURI: string[];
  url?: string;
  saved?: boolean;
  customDataTree: CustomTreeData[];
}

export interface ConfigForm {
  name: string;
}
