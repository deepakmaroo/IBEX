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
  getDataSelected: (data: DataTreeSelected) => void;
  treeData: TreeNodeData[];
  height?: string;
}

export const TreeLibrary = ({
  getDataSelected,
  treeData,
  height,
}: TreeLibraryProps) => {
  const tree = useTree();
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    if (selectedNode) {
      const handleAdd = (): void => {
        const dataGrid: DataTreeSelected = {
          path: selectedNode.value,
        };
        getDataSelected(dataGrid);
      };

      handleAdd();

      tree.deselect(selectedNode.value);
      tree.clearSelected();
      setSelectedNode(null);
    }
  }, [selectedNode]);

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
      if (selected && !hasChildren && node.label !== undefined) {
        setSelectedNode(node);
      }
    }, [selected, node]);

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
        data={treeData}
        className={classes}
        selectOnClick
        renderNode={(payload) => <Element {...payload} />}
      />
    </ScrollArea>
  );
};
