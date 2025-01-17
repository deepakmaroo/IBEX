import { TreeNodeData } from '@mantine/core';

export type DataTreeSelected = {
  path: string;
};

export type CustomTreeData = {
  name: string;
  data: TreeNodeData[];
};
