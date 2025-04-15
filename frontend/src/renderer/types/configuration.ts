import { URIData } from './uri';
import { DataGridPlot } from './plot';
import { CustomTreeData } from './tree';

export interface BaseConfiguration {
  name: string;
  dataURI: URIData[];
  lastLocalDataSetSelected?: string;
  dataPlot: DataGridPlot[];
  lastURIInput?: string;
}

export interface Configuration extends BaseConfiguration {
  checkedNodeURI: string[];
  customDataTree: CustomTreeData[];
  path?: string;
  saved?: boolean;
  gridLayoutSelected?: string;
}

export interface ConfigForm {
  name: string;
}
