import { useCallback, useEffect } from 'react';
import { TreeLibrariesAccordion } from '../../components';
import { useIbexStore } from '../../stores';
import { Configuration, CustomTreeData } from 'src/renderer/types';
import { TreeNodeData } from '@mantine/core';

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
        occurrences: 0,
        data: [],
        fullUri: ids.fullUri,
      }));
      const updatedActive: Configuration = {
        ...active,
        customDataTree: newCustomDataTree,
      };
      updatedConfiguration(updatedActive);
      setActive(updatedActive.name);
    }
  }, [active.dataIDS]);

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

        

        const nodeInfos = await responseNodeInfo.json();
        const nodeInfoschildren = nodeInfos.children || [];

        if (nodeInfoschildren.length === 0) return;

        const newChildren: TreeNodeData[] = nodeInfoschildren.map((child: any) => ({
          label: child.name,
          value: `${nodeUri}/${child.name}`,
        }));

        /**
         * Update the children of the node
         * @param nodes
         * @param nodeValueToUpdate
         * @returns
         */
        const updateNodeChildren = (
          nodes: TreeNodeData[],
          nodeUri: string,
        ): TreeNodeData[] => {
          if (nodes.length === 0) return newChildren;

          return nodes.map((node) => {
            if (node.value === nodeUri) {
              return {
                ...node,
                children: newChildren,
              };
            }

            if (node.children) {
              return {
                ...node,
                children: updateNodeChildren(node.children, nodeUri),
              };
            }

            return node;
          });
        };

        const updatedCustomDataTree = active.customDataTree.map(
          (item: CustomTreeData) => {
            if (item.fullUri && nodeUri.startsWith(item.fullUri)) {
              return {
                ...item,
                data: updateNodeChildren(item.data, nodeUri),
              };
            }
            return item;
          },
        );

        const updatedActive: Configuration = {
          ...active,
          customDataTree: updatedCustomDataTree,
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
          (item) => item.name === value,
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

  return (
    <TreeLibrariesAccordion
      customDataTree={active.customDataTree}
      height={height}
      handleAccordionChange={handleAccordionChange}
      handleSelectChildren={handleSelectChildren}
    />
  );
};
