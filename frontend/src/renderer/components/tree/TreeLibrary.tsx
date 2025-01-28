import {
  Group,
  RenderTreeNodePayload,
  ScrollArea,
  Text,
  Tree,
  TreeNodeData,
  useTree,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import classes from './TreeLibrary.module.css';
import {
  IconCirclePlus,
  IconFolder,
  IconFolderOpen,
} from '@tabler/icons-react';
import { DataTreeSelected } from 'src/renderer/types';

interface FileIconProps {
  isFolder: boolean;
  expanded: boolean;
}

interface TreeLibraryProps {
  treeData: TreeNodeData[];
  height?: string;
  uri?: string;
  fetchChildrenNodeInfos: (nodeValue: string) => void;
}

interface ElementProps extends RenderTreeNodePayload {
  uri: string;
}

export const TreeLibrary = ({
  treeData,
  height,
  uri,
  fetchChildrenNodeInfos
}: TreeLibraryProps) => {
  const tree = useTree();
  const [selectedNode, setSelectedNode] = useState<DataTreeSelected | null>(
    null,
  );

  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());

  const handleFetchChildren = async (nodeValue: string) => {
    if (loadingNodes.has(nodeValue)) return; // Avoid duplicate fetches

    setLoadingNodes((prev) => new Set(prev).add(nodeValue));
    await fetchChildrenNodeInfos(nodeValue);
    setLoadingNodes((prev) => {
      const updated = new Set(prev);
      updated.delete(nodeValue);
      return updated;
    });
  };

  function FileIcon({ isFolder, expanded }: FileIconProps) {
    if (isFolder) {
      return expanded ? (
        <IconFolderOpen
          color="var(--mantine-color-blue-8)"
          size={14}
          stroke={2.5}
        />
      ) : (
        <IconFolder
          color="var(--mantine-color-blue-8)"
          size={14}
          stroke={2.5}
        />
      );
    }

    return <IconCirclePlus size={14} color="var(--mantine-color-blue-8)" />;
  }

  function Element({
    node,
    expanded,
    hasChildren,
    elementProps,
    selected,
    uri
  }: ElementProps) {
    useEffect(() => {
      const fetchData = async () => {
        if (selected && selectedNode?.path !== node.value) {
          setSelectedNode({ path: node.value });
          console.log("nodes", node)
          await fetchChildrenNodeInfos(node.value);


        }
      };
      fetchData();
    }, [selected, node.value, selectedNode]);

    return (
      <Group gap={5} {...elementProps}>
        <FileIcon isFolder={true} expanded={expanded} />
        <Text>{node.label}</Text>
      </Group>
    );
  }

  return (
    <ScrollArea h={height}>
      <Tree
        tree={tree}
        data={treeData}
        className={classes}
        selectOnClick
        renderNode={(payload) => <Element {...payload}  uri={uri}/>}
      />
    </ScrollArea>
  );
};
