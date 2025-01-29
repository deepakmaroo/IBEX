import { TreeNodeData } from '@mantine/core';
import { IDSData } from './ids';

export type DataTreeSelected = {
  path: string;
};


export type CustomTreeData = IDSData & {
  data: TreeNodeData[];
};
