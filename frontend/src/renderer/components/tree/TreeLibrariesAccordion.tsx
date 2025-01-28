import { Accordion, ScrollArea, TreeNodeData } from '@mantine/core';
import { Configuration, CustomTreeData } from 'src/renderer/types';
import { TreeLibrary } from '../../components';

interface VisualizationTreeProps {
  customDataTree: CustomTreeData[];
  height: string;
  handleAccordionChange: (value: string) => void;
  fetchChildrenNodeInfos: (uri: string, nodeValue: string) => void;
}

export const TreeLibrariesAccordion = ({
  customDataTree,
  height,
  handleAccordionChange,
}: VisualizationTreeProps) => {

  const fetchChildrenNodeInfos = async (uri: string, nodeValue: string) => {
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
      const updatedCustomDataTree = customDataTree.map((item) => {
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
      // const updatedActive: Configuration = {
      //   ...active,
      //   customDataTree: updatedCustomDataTree,
      // };
      // updatedConfiguration(updatedActive);
      // setActive(updatedActive.name);
    } catch (error) {
      console.error(error);
    }
  };

  const items = customDataTree.map((item) => (
    <Accordion.Item key={`accodion-${item.name}`} value={item.name}>
      <Accordion.Control>{item.name}</Accordion.Control>
      <Accordion.Panel>
        <TreeLibrary
          treeData={item.data}
          uri={item.uri}
          fetchChildrenNodeInfos={(nodeValue) =>
            fetchChildrenNodeInfos(item.uri, nodeValue)
          }
        />
      </Accordion.Panel>
    </Accordion.Item>
  ));

  return (
    <ScrollArea h={height}>
      <Accordion onChange={handleAccordionChange}>{items}</Accordion>
    </ScrollArea>
  );
};
