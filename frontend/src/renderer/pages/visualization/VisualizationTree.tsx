import { useCallback, useEffect, useState } from 'react';
import { TreeLibrariesAccordion } from '../../components';
import { useIbexState } from '../../stores';
import { CustomTreeData } from 'src/renderer/types';
import { TreeNodeData } from '@mantine/core';

interface VisualizationTreeProps {
  height: string;
}

export const VisualizationTree = ({ height }: VisualizationTreeProps) => {
  const { active } = useIbexState();
  const [customDataTree, setCustomDataTree] = useState<CustomTreeData[]>([]);

  useEffect(() => {
    if (active && active.dataIDS) {
      const newCustomDataTree: CustomTreeData[] = active.dataIDS.map((ids) => ({
        name: ids.name,
        uri: ids.uri,
        occurrences: ids.occurrences,
        data: [],
      }));
      setCustomDataTree(newCustomDataTree);
    }
  }, [active]);
  const handleAccordionChange =  useCallback(async(value: string) => {
    if (value) {
      /**
       * Fetch ids children
       */
      try {
        const selectedDataTree = customDataTree.find((item) => item.name === value);

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
              value: child.name,
              children: [],
            });
          });
          // selectedDataTree.data.push(...newChildren);

          const updatedCustomDataTree = customDataTree.map((item) => {
            if (item.name === value) {
              return {
                ...item,
                data: selectedDataTree.data,
              };
            }
            return item;
          });
          console.log('updatedCustomDataTree', updatedCustomDataTree);

          setCustomDataTree(updatedCustomDataTree);

        }
      } catch (error) {
        console.error(error);
      }
    }
  }, [customDataTree]);


  return (
    <TreeLibrariesAccordion
      dataTree={customDataTree}
      height={height}
      handleAccordionChange={handleAccordionChange}
    />
  );
};
