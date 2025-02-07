import {
  Checkbox,
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
import {
  IconFileUnknown,
  IconFolder,
  IconFolderOpen,
  IconHash,
  IconRipple,
  IconTypography,
} from '@tabler/icons-react';
import classes from './TreeLibrary.module.css';
import { CustomTreeNodeData, NodeInfoTypeEnum } from '../../types';

interface NodeIconProps {
  node: TreeNodeData;
  type: NodeInfoTypeEnum;
  expanded: boolean;
}

interface TreeLibraryProps {
  treeData: CustomTreeNodeData[];
  height?: string;
  checkedNodes?: string[];
  handleSelectChildren: (node: string) => void;
  getCheckedNodes?: (nodes: string[]) => void;
}

interface ElementProps extends RenderTreeNodePayload {
  type: NodeInfoTypeEnum;
}

export const TreeLibrary = ({
  treeData,
  height,
  checkedNodes,
  handleSelectChildren,
  getCheckedNodes
}: TreeLibraryProps) => {
  const tree = useTree();
  const [selectedNode, setSelectedNode] = useState<string>(null);

  //Update checked nodes and get the nodes checked
  useEffect(() => {
    if (!tree) return;

    for (const node of checkedNodes) {
      tree.checkNode(node);
    }
    
    const newCheckedNodes = tree.getCheckedNodes();
    console.log("checkedNodes", newCheckedNodes);
    getCheckedNodes(newCheckedNodes.map((node) => node.value));
    

  }, [tree]);


  function NodeIcon({ node, type, expanded }: NodeIconProps) {
    const checked = tree.isNodeChecked(node.value);

    const getNodeIcon = (type: NodeInfoTypeEnum, expanded: boolean) => {
      const commonProps = {
        size: 14,
        stroke: 2.5,
        color: 'var(--mantine-color-blue-8)',
      };

      const icons: Record<NodeInfoTypeEnum, JSX.Element> = {
        [NodeInfoTypeEnum.STRUCTURE]: expanded ? (
          <IconFolderOpen {...commonProps} />
        ) : (
          <IconFolder {...commonProps} />
        ),
        [NodeInfoTypeEnum.ARRAY]: expanded ? (
          <IconFolderOpen {...commonProps} />
        ) : (
          <IconFolder {...commonProps} />
        ),
        [NodeInfoTypeEnum.INTEGER]: (
          <>
            <Checkbox
              checked={checked}
              onClick={() => {
                !checked
                  ? tree.checkNode(node.value)
                  : tree.uncheckNode(node.value);
              }}
            />
            <IconHash {...commonProps} />
          </>
        ),
        [NodeInfoTypeEnum.FLOAT]: (
          <>
            <Checkbox
              checked={checked}
              onClick={() => {
                !checked
                  ? tree.checkNode(node.value)
                  : tree.uncheckNode(node.value);
              }}
            />
            <IconRipple {...commonProps} />
          </>
        ),
        [NodeInfoTypeEnum.STRING]: (
          <>
            <Checkbox
              checked={checked}
              onClick={() => {
                !checked
                  ? tree.checkNode(node.value)
                  : tree.uncheckNode(node.value);
              }}
            />
            <IconTypography {...commonProps} />
          </>
        ),
      };
      return icons[type] || <IconFileUnknown {...commonProps} />;
    };

    return type ? (
      getNodeIcon(type, expanded)
    ) : (
      <IconFileUnknown
        size={14}
        stroke={2.5}
        color="var(--mantine-color-blue-8)"
      />
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
          setSelectedNode(node.value);
          if (
            type === NodeInfoTypeEnum.STRUCTURE ||
            type === NodeInfoTypeEnum.ARRAY ||
            !expanded
          ) {
            await handleSelectChildren(node.value);
          }
        }
      };
      fetchData();
    }, [selected, node.value, type]);

    useEffect(() => {
      if (textRef.current) {
        const { scrollWidth, offsetWidth } = textRef.current;
        setIsTextOverflowing(scrollWidth > offsetWidth);
      }
    }, [node.label]);

    return (
      <Group gap={5} {...elementProps}>
        <NodeIcon type={type} expanded={expanded} node={node}/>
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
        onClick={(node) => console.log(node)}
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
