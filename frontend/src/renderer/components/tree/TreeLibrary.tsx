import {
  Group,
  RenderTreeNodePayload,
  ScrollArea,
  Text,
  Tooltip,
  Tree,
  useTree,
} from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import {
  IconCirclePlus,
  IconFolder,
  IconFolderOpen,
} from '@tabler/icons-react';
import classes from './TreeLibrary.module.css';
import { CustomTreeNodeData, NodeInfoTypeEnum } from 'src/renderer/types';

interface FileIconProps {
  isFolder: boolean;
  expanded: boolean;
}

interface TreeLibraryProps {
  treeData: CustomTreeNodeData[];
  height?: string;
  handleSelectChildren: (node: string) => void; // Passer l'objet complet du nœud
}

interface ElementProps extends RenderTreeNodePayload {
  type: NodeInfoTypeEnum;
}

export const TreeLibrary = ({
  treeData,
  height,
  handleSelectChildren,
}: TreeLibraryProps) => {
  const tree = useTree();
  const [selectedNode, setSelectedNode] = useState<string>(null);

  function FileIcon({ isFolder, expanded }: FileIconProps) {
    return isFolder ? (
      expanded ? (
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
      )
    ) : (
      <IconCirclePlus size={14} color="var(--mantine-color-blue-8)" />
    );
  }

  function Element({
    node,
    expanded,
    elementProps,
    selected,
    type,
  }: ElementProps) {
    const textRef = useRef<HTMLDivElement>(null);
    const [isTextOverflowing, setIsTextOverflowing] = useState(false);

    useEffect(() => {
      const fetchData = async () => {
        if (selected && selectedNode !== node.value) {
          console.log('fetchData', node.value);
          console.log('type', type);
          setSelectedNode(node.value);
          await handleSelectChildren(node.value);
        }
      };
      fetchData();
    }, [selected, node.value, selectedNode, type]);

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
        renderNode={(payload) => (
          <Element
            {...payload}
            type={(payload.node as CustomTreeNodeData).type}
          />
        )}
      />
    </ScrollArea>
  );
};
