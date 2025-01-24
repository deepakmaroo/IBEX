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
}

export const TreeLibrary = ({
  treeData,
  height,
  uri,
}: TreeLibraryProps) => {
  const tree = useTree();
  const [selectedNode, setSelectedNode] = useState<DataTreeSelected | null>(
    null,
  );

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
      const fetchData = async () => {
        if (selected && selectedNode?.path !== node.value) {
          setSelectedNode({ path: node.value });

          try {
            
            
            const responseNodeInfo= await fetch(
              `${window.env.API_URL}/ids_info/node_info/?uri=${encodeURIComponent(`${uri}/${node.value}`)}`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            );

            if (!responseNodeInfo.ok) {
              const error = await responseNodeInfo.json();
              throw new Error(error.detail || 'Failed to fetch IDS data');
            }
      
            const nodeInfos = await responseNodeInfo.json();

            console.log("nodeInfos", nodeInfos);

            
          } catch (error) {
            console.error(error);
          }
        }
      };
      fetchData();
    }, [selected, node.value, selectedNode]);

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
        renderNode={(payload) => <Element {...payload}  />}
      />
    </ScrollArea>
  );
};
