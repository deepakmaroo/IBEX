import { Accordion, ScrollArea } from '@mantine/core';
import { CustomTreeData } from 'src/renderer/types';
import { TreeLibrary } from '../../components';

interface VisualizationTreeProps {
  customDataTree: CustomTreeData[];
  height: string;
  checkedNodes: string[];
  handleAccordionChange: (value: string) => void;
  handleSelectChildren: (nodeValue: string) => void;
  getNodesChecked: (ids: string, nodes: string[]) => void;
}

export const TreeLibrariesAccordion = ({
  customDataTree,
  height,
  checkedNodes,
  handleAccordionChange,
  handleSelectChildren,
  getNodesChecked,
}: VisualizationTreeProps) => {
  const items = customDataTree.map((item) => (
    <Accordion.Item key={`accodion-${item.name}`} value={item.name}>
      <Accordion.Control>{item.name}</Accordion.Control>
      <Accordion.Panel>
        <TreeLibrary
          treeData={item.data}
          checkedNodes={checkedNodes}
          handleSelectChildren={handleSelectChildren}
          getCheckedNodes={(nodesChecked) => {
            getNodesChecked(item.name, nodesChecked);
          }}
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
