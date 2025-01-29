import { TreeNodeData } from '@mantine/core';

export type DataTreeSelected = {
  path: string;
};


export type CustomTreeData = IDSData & {
  data: TreeNodeData[];
};
