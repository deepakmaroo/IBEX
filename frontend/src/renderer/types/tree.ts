import { TreeNodeData } from '@mantine/core';
import { IDSDataSelected } from './ids';
import { NodeInfoTypeEnum } from './nodesInfos';

export type DataTreeSelected = {
  path: string;
};

export type CustomTreeNodeData = TreeNodeData & {
  type: NodeInfoTypeEnum;
  children: CustomTreeNodeData[];
};

export type CustomTreeData = IDSDataSelected & {
  fullUri: string;
  data: CustomTreeNodeData[];
};

export type CheckedNodeIds = {
  idsName: string;
  checkedNodes: string[];
}
