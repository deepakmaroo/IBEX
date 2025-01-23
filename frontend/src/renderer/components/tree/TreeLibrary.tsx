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
  loadChildren: (node: TreeNodeData) => Promise<TreeNodeData[]>;
}

export const TreeLibrary = ({
  treeData,
  height,
  loadChildren,
}: TreeLibraryProps) => {
  const tree = useTree();
  const [treeDataState, setTreeDataState] = useState(treeData);

  const handleNodeExpand = async (node: TreeNodeData) => {
    // Vérifie si les enfants sont déjà chargés
    if (!node.children || node.children.length === 0) {
      const children = await loadChildren(node);
      const updatedTreeData = treeDataState.map((item) =>
        item.value === node.value
          ? { ...item, children }
          : item
      );
      setTreeDataState(updatedTreeData);
    }
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
  }: RenderTreeNodePayload) {
    useEffect(() => {
      if (expanded && hasChildren) {
        handleNodeExpand(node);
      }
    }, [expanded]);

    return (
      <Group gap={5} {...elementProps}>
        <FileIcon isFolder={hasChildren} expanded={expanded} />
        <Text>{node.label}</Text>
      </Group>
    );
  }

  return (
    <ScrollArea h={height}>
      <Tree
        tree={tree}
        data={treeDataState}
        className={classes}
        selectOnClick
        renderNode={(payload) => <Element {...payload} />}
      />
    </ScrollArea>
  );
};
