import { TreeNodeData } from '@mantine/core';
import { NodeInfoTypeEnum } from './nodesInfos';
import { URIData } from './ids';

export type DataTreeSelected = {
  path: string;
};

export type CustomTreeNodeData = TreeNodeData & {
  type: NodeInfoTypeEnum;
  children: CustomTreeNodeData[];
};

export type CustomTreeData = URIData & {
  data: CustomTreeNodeData[];
};

export type CheckedNodeURI = {
  uri: string;
  checkedNodes: string[];
}
