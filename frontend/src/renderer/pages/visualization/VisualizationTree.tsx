import { useCallback, useEffect, useState } from 'react';
import { TreeLibrariesAccordion } from '../../components';
import { useIbexStore } from '../../stores';
import { Configuration, CustomTreeData } from 'src/renderer/types';
import { TreeNodeData } from '@mantine/core';

interface VisualizationTreeProps {
  height: string;
}

export const VisualizationTree = ({ height }: VisualizationTreeProps) => {
  const { active, setActive, updatedConfiguration } = useIbexStore();

  
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

  const handleAccordionChange =  useCallback(async(value: string) => {
    if (value) {
      /**
       * Fetch ids children
       */
      try {
        const selectedDataTree = active.customDataTree.find((item) => item.name === value);

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
            const updatedCustomDataTree = active.customDataTree.map((item) => {
              if (item.name === value) {
                return {
                  ...item,
                  data: newChildren,
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
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
  }, [active]);

  const fetchChildrenNodeInfos = useCallback(async (uri: string, nodeValue: string) => {
    try {
      const responseNodeInfo = await fetch(
        `${window.env.API_URL}/ids_info/node_info/?uri=${encodeURIComponent(`${uri}/${nodeValue}`)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
  
      if (!responseNodeInfo.ok) {
        const error = await responseNodeInfo.json();
        throw new Error(error.detail || 'Failed to fetch IDS data');
      }
  
      const nodeInfos = await responseNodeInfo.json();
  
      // Fonction récursive pour mettre à jour un nœud spécifique
      const updateNodeChildren = (nodes: TreeNodeData[], nodeValueToUpdate: string): TreeNodeData[] => {
        return nodes.map((node) => {
          if (node.value === nodeValueToUpdate) {
            // Met à jour les enfants du nœud trouvé
            const newChildren: TreeNodeData[] = nodeInfos.children.map((child: any) => ({
              label: child.name,
              value: `${nodeValue}/${child.name}`,
            }));
  
            return {
              ...node,
              children: newChildren,
            };
          }
  
          // Si le nœud a des enfants, continuer à chercher récursivement
          if (node.children && node.children.length > 0) {
            return {
              ...node,
              children: updateNodeChildren(node.children, nodeValueToUpdate),
            };
          }
  
          return node;
        });
      };
  
      // Met à jour l'arbre personnalisé
      const updatedCustomDataTree = active.customDataTree.map((item) => {
        if (item.uri === uri) {
          return {
            ...item,
            data: updateNodeChildren(item.data, nodeValue),
          };
        }
        return item;
      });
  
      console.log('updatedCustomDataTree', updatedCustomDataTree);
  
      // Si nécessaire, mettre à jour l'état global
      const updatedActive: Configuration = {
        ...active,
        customDataTree: updatedCustomDataTree,
      };
      updatedConfiguration(updatedActive);
      setActive(updatedActive.name);
    } catch (error) {
      console.error(error);
    }
  }, [active, setActive, updatedConfiguration]);

  return (
    <TreeLibrariesAccordion
      customDataTree={active.customDataTree}
      height={height}
      handleAccordionChange={handleAccordionChange}
      fetchChildrenNodeInfos={fetchChildrenNodeInfos}
    />
  );
};
