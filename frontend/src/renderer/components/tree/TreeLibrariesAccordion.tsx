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
  fetchChildrenNodeInfos
}: VisualizationTreeProps) => {


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
