import { Accordion, Group, ScrollArea, Text, Tooltip } from '@mantine/core';
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

interface AccordionLabelProps {
  label: string;
  description: string;
}

function AccordionLabel({ label, description }: AccordionLabelProps) {
  return (
    <Group styles={{
      root:{
        display:'block'
      }
    }}>
      {/* <Avatar src={image} radius="xl" size="lg" /> */}
      <div>
        <Text>{label}</Text>
        <Tooltip label={description} position='right'>
          <Text size="sm" c="dimmed" fw={400} styles={{
          root:{
            whiteSpace:'nowrap'
          }
        }}>
            {description}
          </Text>
        </Tooltip>
      </div>
    </Group>
  );
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
    <Accordion.Item key={`accodion-${item.name}-${item.uri}`} value={`${item.fullUri}`}>
      <Accordion.Control>
        <AccordionLabel label={item.name} description={item.uri} />
      </Accordion.Control>
      <Accordion.Panel>
        <TreeLibrary
          treeData={item.data}
          checkedNodes={
            checkedNodes.find((node) => node.idsName === item.name)
              ?.checkedNodes || []
          }
          handleSelectChildren={handleSelectChildren}
          getCheckedNodes={(nodesChecked) => {
            getNodesChecked(item.name, nodesChecked);
          }}
        />
      </Accordion.Panel>
    </Accordion.Item>
  ));

  const customStyles = `
    .mantine-ScrollArea-viewport > div {
      display: block !important;
    }
  `;

  return (
    <ScrollArea h={height}>
      <style>{customStyles}</style>
      <Accordion onChange={handleAccordionChange}>{items}</Accordion>
    </ScrollArea>
  );
};
