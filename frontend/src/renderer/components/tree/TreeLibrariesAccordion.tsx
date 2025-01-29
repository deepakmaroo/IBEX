import { Accordion, ScrollArea, TreeNodeData } from '@mantine/core';
import { Configuration, CustomTreeData } from 'src/renderer/types';
import { TreeLibrary } from '../../components';

interface VisualizationTreeProps {
  customDataTree: CustomTreeData[];
  height: string;
  handleAccordionChange: (value: string) => void;
  handleSelectChildren: (nodeValue: string) => void;
}

export const TreeLibrariesAccordion = ({
  customDataTree,
  height,
  handleAccordionChange,
  handleSelectChildren
}: VisualizationTreeProps) => {


  const items = customDataTree.map((item) => (
    <Accordion.Item key={`accodion-${item.name}`} value={item.name}>
      <Accordion.Control>{item.name}</Accordion.Control>
      <Accordion.Panel>
        <TreeLibrary
          treeData={item.data}
          uri={item.uri}
          handleSelectChildren={handleSelectChildren}
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
