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
        occurrences: ids.occurrences,
        data: [],
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
    async (fullUri: string) => {
      if (!fullUri) return;

      try {
        const responseNodeInfo = await fetch(
          `${window.env.API_URL}/ids_info/node_info/?uri=${encodeURIComponent(fullUri)}`,
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
        const children = nodeInfos.children || [];

        if (children.length === 0) return;

        const newChildren: TreeNodeData[] = children.map((child: any) => ({
          label: child.name,
          value: `${fullUri}/${child.name}`,
        }));

        const updateNodeChildren = (
          nodes: TreeNodeData[],
          nodeValueToUpdate: string,
        ): TreeNodeData[] =>
          nodes.map((node) => {
            if (node.value === nodeValueToUpdate) {
              return { ...node, children: newChildren };
            }

            if (node.children?.length) {
              return {
                ...node,
                children: updateNodeChildren(node.children, nodeValueToUpdate),
              };
            }

            return node;
          });

        const updatedCustomDataTree = active.customDataTree.map((item) => {
          if (item.uri && fullUri.startsWith(item.uri)) {
            const nodeValue = fullUri.replace(`${item.uri}/`, '');
            return {
              ...item,
              data: updateNodeChildren(item.data, nodeValue),
            };
          }
          return item;
        });

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
            const fullUri = `${selectedCustomData.uri}#${selectedCustomData.name}:${selectedCustomData.occurrences[0]}`;
            fetchNodeInfos(fullUri);
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
    (uri: string, nodeValue: string) => {
      const fullUri = `${uri}/${nodeValue}`;
      fetchNodeInfos(fullUri);
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
