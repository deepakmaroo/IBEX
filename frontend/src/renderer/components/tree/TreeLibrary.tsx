import {
  Box,
  Group,
  RenderTreeNodePayload,
  ScrollArea,
  Text,
  Tooltip,
  Tree,
  TreeNodeData,
  useTree,
} from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
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
  handleSelectChildren: (nodeValue: string) => void;
}

interface ElementProps extends RenderTreeNodePayload {
  uri: string;
}

export const TreeLibrary = ({
  treeData,
  height,
  uri,
  handleSelectChildren,
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

  function Element({ node, expanded, elementProps, selected }: ElementProps) {
    const textRef = useRef<HTMLDivElement>(null);
    const [isTextOverflowing, setIsTextOverflowing] = useState(false);

    useEffect(() => {
      const fetchData = async () => {
        if (selected && selectedNode?.path !== node.value) {
          setSelectedNode({ path: node.value });
          await handleSelectChildren(node.value);
        }
      };
      fetchData();
    }, [selected, node.value, selectedNode]);
  
    useEffect(() => {
      if (textRef.current) {
        const { scrollWidth, offsetWidth } = textRef.current;
        setIsTextOverflowing(scrollWidth > offsetWidth);
      }
    }, [node.label]);
  
    return (
      <Group gap={5} {...elementProps}>
        <FileIcon isFolder={true} expanded={expanded} />
        {isTextOverflowing ? (
          <Tooltip label={node.label} position="left">
            <Text truncate="end" w={125} ref={textRef}>
              {node.label}
            </Text>
          </Tooltip>
        ) : (
          <Text truncate="end" w={125} ref={textRef}>
            {node.label}
          </Text>
        )}
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
        renderNode={(payload) => <Element {...payload} uri={uri} />}
      />
    </ScrollArea>
  );
};
