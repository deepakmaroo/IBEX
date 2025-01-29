import { TreeNodeData } from '@mantine/core';
import { IDSData } from './ids';
import { NodeInfoTypeEnum } from './nodesInfos';

export type DataTreeSelected = {
  path: string;
};

export type CustomTreeNodeData = TreeNodeData & {
  type: NodeInfoTypeEnum;
  children: CustomTreeNodeData[];
}

export type CustomTreeData = IDSData & {
  data: CustomTreeNodeData[];
};
