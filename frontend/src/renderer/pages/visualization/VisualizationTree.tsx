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
   * Handle accordion change
   * @param value
   * @returns
   */
  const handleAccordionChange = useCallback(
    async (value: string) => {
      if (value) {
        try {
          const selectedDataTree = active.customDataTree.find(
            (item) => item.name === value,
          );

          const responseNodeInfo = await fetch(
            `${window.env.API_URL}/ids_info/node_info/?uri=${encodeURIComponent(`${selectedDataTree.uri}#${selectedDataTree.name}:${selectedDataTree.occurrences[0]}`)}`,
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
          console.log('nodeInfos', nodeInfos);
          console.log('nodeInfos children', nodeInfos.children);

          if (nodeInfos.children.length > 0) {
            const newChildren: TreeNodeData[] = [];
            nodeInfos.children.map((child: any) => {
              newChildren.push({
                label: child.name,
                value: `#${value}:0/${child.name}`,
                children: [],
              });
            });

            // Add children to the selectedDataTree if not exists
            if (!selectedDataTree.data.length) {
              const updatedCustomDataTree = active.customDataTree.map(
                (item) => {
                  if (item.name === value) {
                    return {
                      ...item,
                      data: newChildren,
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
            }
          }
        } catch (error) {
          console.error(error);
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
  const fetchChildrenNodeInfos = useCallback(
    async (uri: string, nodeValue: string) => {
      try {
        const responseNodeInfo = await fetch(
          `${window.env.API_URL}/ids_info/node_info/?uri=${encodeURIComponent(`${uri}/${nodeValue}`)}`,
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

        /**
         * Update the children of the node
         * @param nodes
         * @param nodeValueToUpdate
         * @returns
         */
        const updateNodeChildren = (
          nodes: TreeNodeData[],
          nodeValueToUpdate: string,
        ): TreeNodeData[] => {
          return nodes.map((node) => {
            if (node.value === nodeValueToUpdate) {
              const newChildren: TreeNodeData[] = nodeInfos.children.map(
                (child: any) => ({
                  label: child.name,
                  value: `${nodeValue}/${child.name}`,
                }),
              );

              return {
                ...node,
                children: newChildren,
              };
            }

            // If the node has children, update them
            if (node.children && node.children.length > 0) {
              return {
                ...node,
                children: updateNodeChildren(node.children, nodeValueToUpdate),
              };
            }

            return node;
          });
        };

        const updatedCustomDataTree = active.customDataTree.map((item) => {
          if (item.uri === uri) {
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

  return (
    <TreeLibrariesAccordion
      customDataTree={active.customDataTree}
      height={height}
      handleAccordionChange={handleAccordionChange}
      fetchChildrenNodeInfos={fetchChildrenNodeInfos}
    />
  );
};
