import {
  Checkbox,
  Group,
  RenderTreeNodePayload,
  ScrollArea,
  Text,
  Tooltip,
  Tree,
  TreeNodeData,
  UseTreeReturnType,
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
import {
  CustomTreeNodeData,
  NodeInfoTypeEnum,
  Configuration,
} from '../../types';

interface NodeIconProps {
  node: TreeNodeData;
  type: NodeInfoTypeEnum;
  expanded: boolean;
  checkedNodes: string[];
  tree: UseTreeReturnType;
  getCheckedNodes: (nodes: string[]) => void;
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
  nodeShowErrors: boolean;
  selectedNode: string | null;
  checkedNodes?: string[];
  tree: UseTreeReturnType;
  setSelectedNode: (node: string | null) => void;
  handleSelectChildren: (node: string) => void;
  getCheckedNodes: (nodes: string[]) => void;
}

function Element({
  node,
  expanded,
  elementProps,
  selected,
  type,
  nodeShowErrors,
  selectedNode,
  checkedNodes,
  tree,
  setSelectedNode,
  handleSelectChildren,
  getCheckedNodes,
}: ElementProps) {
  const textRef = useRef<HTMLDivElement>(null);
  const [isTextOverflowing, setIsTextOverflowing] = useState(false);

  const fetchData = async () => {
    if (
      (type === NodeInfoTypeEnum.STRUCTURE ||
      type === NodeInfoTypeEnum.ARRAY)
    ) {
      await handleSelectChildren(node.value);
    }
  };

  useEffect(() => {
    if (selected) {
      setSelectedNode(node.value);
    } else if (!expanded) {
      setSelectedNode(null);
    }
  }, [selected, expanded]);


  useEffect(() => {
    if (selectedNode == node.value && expanded) {
      fetchData();
    }

  }, [selectedNode, expanded]);

  useEffect(() => {
    if (textRef.current) {
      const { scrollWidth, offsetWidth } = textRef.current;
      setIsTextOverflowing(scrollWidth > offsetWidth);
    }
  }, [node.label]);

  return (
    <Group gap={5} {...elementProps}>
      <NodeIcon
        type={type}
        expanded={expanded}
        node={node}
        checkedNodes={checkedNodes}
        tree={tree}
        getCheckedNodes={getCheckedNodes}
      />
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

function NodeIcon({
  node,
  type,
  expanded,
  checkedNodes,
  tree,
  getCheckedNodes,
}: NodeIconProps) {
  const [checked, setChecked] = useState<boolean>(
    checkedNodes.includes(node.value) ? true : tree.isNodeChecked(node.value),
  );
  const getNodeIcon = (type: NodeInfoTypeEnum, expanded: boolean) => {
    const commonProps = {
      size: 14,
      stroke: 2.5,
      color: 'var(--mantine-color-blue-8)',
    };

    // Check the node and save config
    const handleCheckNode = () => {
      if (
        type === NodeInfoTypeEnum.INTEGER ||
        type === NodeInfoTypeEnum.FLOAT ||
        type === NodeInfoTypeEnum.STRING
      ) {
        // Fetch checkedNodes with Config
        if (!checked === true) {
          tree.checkNode(node.value);
          !checkedNodes.find((checkedNode) => checkedNode === node.value) &&
            checkedNodes.push(node.value);
        } else {
          tree.uncheckNode(node.value);
          checkedNodes = checkedNodes.filter(
            (uncheckedNode) => uncheckedNode !== node.value,
          );
        }
        setChecked(!checked);
        getCheckedNodes(checkedNodes); // Save checkedNodes in config
      }
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
          <Checkbox checked={checked} onChange={handleCheckNode} />
          <IconHash {...commonProps} />
        </>
      ),
      [NodeInfoTypeEnum.FLOAT]: (
        <>
          <Checkbox checked={checked} onChange={handleCheckNode} />
          <IconRipple {...commonProps} />
        </>
      ),
      [NodeInfoTypeEnum.STRING]: (
        <>
          <Checkbox checked={checked} onChange={handleCheckNode} />
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

export const TreeLibrary = ({
  treeData,
  height,
  checkedNodes,
  handleSelectChildren,
  getCheckedNodes,
}: TreeLibraryProps) => {
  const tree = useTree();
  const [selectedNode, setSelectedNode] = useState<string>(null);

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
            nodeShowErrors={(payload.node as CustomTreeNodeData).seeErrorBars}
            selectedNode={selectedNode}
            tree={tree}
            checkedNodes={checkedNodes}
            setSelectedNode={setSelectedNode}
            handleSelectChildren={handleSelectChildren}
            getCheckedNodes={getCheckedNodes}
          />
        )}
      />
    </ScrollArea>
  );
};
