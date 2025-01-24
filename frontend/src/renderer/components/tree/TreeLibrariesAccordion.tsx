import { Accordion, ScrollArea } from '@mantine/core';
import { CustomTreeData, DataTreeSelected } from 'src/renderer/types';
import { TreeLibrary } from '../../components';

interface VisualizationTreeProps {
  dataTree: CustomTreeData[];
  height: string;
  handleAccordionChange: (value: string) => void;
}

export const TreeLibrariesAccordion = ({
  dataTree,
  height,
  handleAccordionChange,
}: VisualizationTreeProps) => {
  const items = dataTree.map((item) => (
    <Accordion.Item key={`accodion-${item.name}`} value={item.name}>
      <Accordion.Control>{item.name}</Accordion.Control>
      <Accordion.Panel>
        <TreeLibrary treeData={item.data} uri={item.uri} />
      </Accordion.Panel>
    </Accordion.Item>
  ));

  return (
    <ScrollArea h={height}>
      <Accordion onChange={handleAccordionChange}>{items}</Accordion>
    </ScrollArea>
  );
};
