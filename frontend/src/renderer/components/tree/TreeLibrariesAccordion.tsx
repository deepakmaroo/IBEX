import { Accordion, ScrollArea } from '@mantine/core';
import { CustomTreeData, DataTreeSelected } from 'src/renderer/types';
import { TreeLibrary } from '../../components';

interface VisualizationTreeProps {
  dataTree: CustomTreeData[];
  height: string;
  getDataSelected: (data: DataTreeSelected) => void;
}

export const TreeLibrariesAccordion = ({
  dataTree,
  height,
}: VisualizationTreeProps) => {

  const handleAccordionChange = async (value: string) => {
    if (value) {
      /**
       * Fetch ids children 
       */
      try {
            
        const selectedItem = dataTree.find((item) => item.name === value);

        console.log("selectedItem", selectedItem);

        const responseNodeInfo= await fetch(
          `${window.env.API_URL}/ids_info/node_info/?uri=${encodeURIComponent(`${selectedItem.uri}#${selectedItem.name}:${selectedItem.occurrences[0]}`)}`,
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

        console.log("nodeInfos", nodeInfos);

        
      } catch (error) {
        console.error(error);
      }
    }
  };

  const items = dataTree.map((item) => (
    <Accordion.Item key={`accodion-${item.name}`} value={item.name}>
      <Accordion.Control>{item.name}</Accordion.Control>
      <Accordion.Panel>
        <TreeLibrary treeData={item.data} uri={item.uri}/>
      </Accordion.Panel>
    </Accordion.Item>
  ));

  return (
    <ScrollArea h={height}>
      <Accordion>{items}</Accordion>
    </ScrollArea>
  );
};
