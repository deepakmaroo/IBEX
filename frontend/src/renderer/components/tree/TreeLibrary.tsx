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
import { useCallback, useEffect, useRef, useState } from 'react';
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
  checkedNodes: string[];
  tree: UseTreeReturnType;
  textRef: React.RefObject<HTMLDivElement>;
  isOverflowing: boolean;
  getCheckedNodes: (nodes: string[]) => void;
}

interface TreeLibraryProps {
  treeData: CustomTreeNodeData[];
  height?: string;
  checkedNodes?: string[];
  expendAll?: boolean;
  handleSelectChildren: (node: string) => void;
  getCheckedNodes?: (nodes: string[]) => void;
}

interface ElementProps extends RenderTreeNodePayload {
  type: NodeInfoTypeEnum;
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
      type === NodeInfoTypeEnum.STRUCTURE ||
      type === NodeInfoTypeEnum.ARRAY
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
        textRef={textRef}
        isOverflowing={isTextOverflowing}
        getCheckedNodes={getCheckedNodes}
      />
    </Group>
  );
}

function NodeIcon({
  node,
  type,
  expanded,
  checkedNodes,
  tree,
  isOverflowing,
  textRef,
  getCheckedNodes,
}: NodeIconProps) {
  const [checked, setChecked] = useState<boolean>(false);

  useEffect(() => {
    setChecked(checkedNodes.includes(node.value));
  }, [checkedNodes]);

  const getNodeIcon = (type: NodeInfoTypeEnum, expanded: boolean) => {
    const commonProps = {
      size: 14,
      stroke: 2.5,
      color: 'var(--mantine-color-blue-8)',
    };

    const handleCheckNode = useCallback(() => {
      if (
        [
          NodeInfoTypeEnum.INTEGER,
          NodeInfoTypeEnum.FLOAT,
          NodeInfoTypeEnum.STRING,
        ].includes(type)
      ) {
        if (checked) {
          tree.uncheckNode(node.value);
          checkedNodes = checkedNodes.filter(
            (uncheckedNode) => uncheckedNode !== node.value,
          );
        } else {
          tree.checkNode(node.value);
          checkedNodes.push(node.value);
        }
        setChecked(!checked);
        getCheckedNodes(checkedNodes);
      }
    }, [checked, checkedNodes, getCheckedNodes, node.value, tree, type]);

    const labels = (
      <Tooltip label={node.label} position="left" disabled={!isOverflowing}>
        <Text truncate="end" w={125} ref={textRef}>
          {node.label}
        </Text>
      </Tooltip>
    );

    const getFolderIcon = () => (
      <Group gap={2}>
        {expanded ? (
          <IconFolderOpen {...commonProps} />
        ) : (
          <IconFolder {...commonProps} />
        )}
        {labels}
      </Group>
    );

    const getCheckboxIcon = (IconComponent: JSX.Element) => (
      <Checkbox
        checked={checked}
        onChange={handleCheckNode}
        styles={{
          label: {
            paddingLeft: 5,
          },
        }}
        label={
          <Group gap={2}>
            {IconComponent}
            {labels}
          </Group>
        }
      />
    );

    const icons: Record<NodeInfoTypeEnum, JSX.Element> = {
      [NodeInfoTypeEnum.STRUCTURE]: getFolderIcon(),
      [NodeInfoTypeEnum.ARRAY]: getFolderIcon(),
      [NodeInfoTypeEnum.INTEGER]: getCheckboxIcon(
        <IconHash {...commonProps} />,
      ),
      [NodeInfoTypeEnum.FLOAT]: getCheckboxIcon(
        <IconRipple {...commonProps} />,
      ),
      [NodeInfoTypeEnum.STRING]: getCheckboxIcon(
        <IconTypography {...commonProps} />,
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
  expendAll,
  handleSelectChildren,
  getCheckedNodes,
}: TreeLibraryProps) => {
  const tree = useTree();
  const [selectedNode, setSelectedNode] = useState<string>(null);

  const expandNodesWithFiles = (nodes: CustomTreeNodeData[]) => {
    const expandRecursively = (node: CustomTreeNodeData) => {
      if (!node.children || node.children.length === 0) return; // No data on folder

      // If the node has files, expand it
      const hasFiles = node.children.length > 0;

      if (hasFiles) {
        tree.expand(node.value);
      }

      // Recursively expand children
      node.children.forEach(expandRecursively);
    };

    nodes.forEach((node) => {
      if (node.children.length > 0) {
        tree.expand(node.value);
      }
      expandRecursively(node);
    });
  };

  useEffect(() => {
    if (expendAll) {
      expandNodesWithFiles(treeData);
    } else {
      tree.collapseAllNodes();
      tree.clearSelected();
    }
  }, [expendAll]);

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
