import { Accordion, ScrollArea } from '@mantine/core';
import { CheckedNodeIds, CustomTreeData } from 'src/renderer/types';
import { TreeLibrary } from '../../components';

interface VisualizationTreeProps {
  customDataTree: CustomTreeData[];
  height: string;
  checkedNodes: CheckedNodeIds[];
  handleAccordionChange: (value: string) => void;
  handleSelectChildren: (nodeValue: string) => void;
  getNodesChecked: (idsName: string, nodes: string[]) => void;
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
          checkedNodes={checkedNodes.find((node) => node.idsName === item.name)?.checkedNodes || []}
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
