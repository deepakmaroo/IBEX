import { useCallback, useEffect } from 'react';
import { TreeLibrariesAccordion } from '../../components';
import { useIbexStore } from '../../stores';
import {
  Configuration,
  CustomTreeData,
  CustomTreeNodeData,
  NodeInfo,
  NodeInfoChildren,
  NodeInfoTypeEnum,
} from '../../types';

interface VisualizationTreeProps {
  height: string;
}

export const VisualizationTree = ({ height }: VisualizationTreeProps) => {
  const { active, setActive, updatedConfiguration } = useIbexStore();

  /**
   * Handle dataIDS change
   */
  useEffect(() => {
    if (active && active.dataIDS) {
      const newCustomDataTree: CustomTreeData[] = active.dataIDS.map((ids) => ({
        name: ids.name,
        uri: ids.uri,
        occurrenceIndex: ids.occurrenceIndex,
        data: [],
        fullUri: `${ids.uri}#${ids.name}:${ids.occurrenceIndex}`,
      }));
      const updatedActive: Configuration = {
        ...active,
        customDataTree: newCustomDataTree,
      };
      updatedConfiguration(updatedActive);
      setActive(updatedActive.name);
    }
  }, [active.dataIDS]);

  useEffect(() => {
    // Refresh expanded root folder when click on New Chart
    active?.lastURIInput && (
      fetchNodeInfos(active.lastURIInput)
    )
  }, [active.lastURIInput])

  /**
   * Handle node update using full URI
   * @param fullUri The full URI for fetching or updating node data
   */
  const fetchNodeInfos = useCallback(
    async (nodeUri: string) => {
      if (!nodeUri) return;

      try {
        const responseNodeInfo = await fetch(
          `${window.env.API_URL}/ids_info/node_info/?uri=${encodeURIComponent(nodeUri)}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          },
        );

        if (!responseNodeInfo.ok) {
          const error = await responseNodeInfo.json();
          throw new Error(error.detail || 'Failed to fetch IDS data');
        }

        const nodeInfos: NodeInfo = await responseNodeInfo.json();
        const nodeInfoschildren = nodeInfos.children || [];

        if (nodeInfoschildren.length === 0) return;

        const newChildren: CustomTreeNodeData[] = nodeInfoschildren.map(
          (child: NodeInfoChildren) => {
            const newValue =
            nodeInfos.type === NodeInfoTypeEnum.ARRAY
                ? `${nodeUri}[0]/${child.name}`
                : `${nodeUri}/${child.name}`;
            return {
              label: child.name,
              value: newValue,
              type: child.type,
              children: [],
            };
          },
        );

        /**
         * Update the children of the node
         * @param nodes
         * @param nodeValueToUpdate
         * @returns
         */
        const updateNodeChildren = (
          dataTree: CustomTreeNodeData[],
          targetUri: string,
        ): CustomTreeNodeData[] => {
          // If the data tree is empty
          if (dataTree.length === 0) {
            return newChildren;
          }

          return dataTree.map((node) => {
            // If the node corresponds to the target, update its children
            if (node.value === targetUri) {
              return {
                ...node,
                children: newChildren,
              };
            }

            // If the node has children
            if (node.children.length > 0) {
              return {
                ...node,
                children: updateNodeChildren(node.children, targetUri),
              };
            }

            // Node no has children
            return node;
          });

        };

        const updatedCustomDataTree = active.customDataTree.map(
          (dataTree: CustomTreeData) => {
            if (dataTree.fullUri && nodeUri.startsWith(dataTree.fullUri)) {
              return {
                ...dataTree,
                data: updateNodeChildren(dataTree.data, nodeUri),
              };
            }
            return dataTree;
          },
        );

        const updatedActive: Configuration = {
          ...active,
          customDataTree: updatedCustomDataTree,
          lastURIInput: nodeUri,
        };

        updatedConfiguration(updatedActive);
        setActive(updatedActive.name);
      } catch (error) {
        console.error(error);
      }
    },
    [active],
  );

  /**
   * Handle accordion change
   * @param value
   * @returns
   */
  const handleAccordionChange = useCallback(
    (value: string) => {
      if (value) {
        const selectedCustomData = active.customDataTree.find(
          (item) => item.fullUri === value,
        );
        if (selectedCustomData) {
          if (selectedCustomData.data.length === 0) {
            fetchNodeInfos(selectedCustomData.fullUri);
          }
        }
      }
    },
    [active],
  );

  /**
   * Fetch children node infos
   * @param uri
   * @param nodeValue
   */
  const handleSelectChildren = useCallback(
    (nodeUri: string) => {
      fetchNodeInfos(nodeUri);
    },
    [active],
  );

  const getNodesChecked = useCallback((idsName: string, nodes: string[]) => {
    const updatedCheckedNodes = active.checkedNodes.map((checkedNode) => {
      if (checkedNode.idsName === idsName) {
        return {
          idsName: idsName,
          checkedNodes: nodes,
        };
      }
      return checkedNode;
    }
    );
    const updatedActive: Configuration = {
      ...active,
      checkedNodes: updatedCheckedNodes,
      
    };
    updatedConfiguration(updatedActive);
    setActive(updatedActive.name);
  }, [
    active,
  ]);

  return (
    <TreeLibrariesAccordion
      customDataTree={active.customDataTree}
      height={height}
      checkedNodes={active.checkedNodes || []}
      handleAccordionChange={handleAccordionChange}
      handleSelectChildren={handleSelectChildren}
      getNodesChecked={getNodesChecked}
    />
  );
};
