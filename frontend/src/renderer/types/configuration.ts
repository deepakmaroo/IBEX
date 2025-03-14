import { URIData } from './ids';
import { DataPlot } from './plot';
import { CheckedNodeURI, CustomTreeData } from './tree';

export interface BaseConfiguration {
  name: string;
  dataURI: URIData[];
  lastLocalDataSetSelected?: string;
  lastURIInput?: string;
  checkedNodeURI: string[];
  dataPlot: DataPlot[];
}
export interface Configuration extends BaseConfiguration {
  url?: string;
  saved?: boolean;
  customDataTree: CustomTreeData[];
  plotEditableUuid?: string;
}

export interface ConfigForm {
  name: string;
}
