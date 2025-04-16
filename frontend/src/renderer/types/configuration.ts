import { URIData } from './uri';
import { DataGridPlot, DataGridPlotToSave } from './plot';
import { CustomTreeData } from './tree';

export interface BaseConfiguration {
  name: string;
  dataURI: URIData[];
  lastLocalDataSetSelected?: string;
  lastURIInput?: string;
}

export interface Configuration extends BaseConfiguration {
  checkedNodeURI: string[];
  customDataTree: CustomTreeData[];
  dataPlot: DataGridPlot[];
  path?: string;
  saved?: boolean;
  gridLayoutSelected?: string | null;
}

export interface ConfigurationToSave extends BaseConfiguration {
  dataPlot: DataGridPlotToSave[];
}

export interface ConfigForm {
  name: string;
}
