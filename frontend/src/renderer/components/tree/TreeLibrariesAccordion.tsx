import { Accordion, ScrollArea, TreeNodeData } from '@mantine/core';
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
