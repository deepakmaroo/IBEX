import { ActionIcon, Container, Group, Tabs } from '@mantine/core';
import { useIbexStore } from '../../stores';
import { IconArrowLeft } from '@tabler/icons-react';
import { useCallback, useState } from 'react';
import { TabsListCustom } from 'src/renderer/components';

export const VisualizationMetaData = () => {
  const { active, updatedConfiguration } = useIbexStore();
  const [ tabsValue, setTabsValue ] = useState<string | null>();

  const handleSwitchGrid = useCallback(() => {
    const updatedActive = {
      ...active,
      gridLayoutSelected: '',
    };
    updatedConfiguration(updatedActive);
  }, [active]);

  return (
    <Container fluid pb={10}>
      <Group>
        <ActionIcon
          variant="filled"
          aria-label="Metadatas"
          onClick={() => handleSwitchGrid()}
        >
          <IconArrowLeft style={{ width: '70%', height: '70%' }} stroke={1.5} />
        </ActionIcon>

        <Tabs variant="none" value={tabsValue} onChange={setTabsValue}>

          <TabsListCustom
            data={['1', '2', '3']}
            value={tabsValue}
          />

          <Tabs.Panel value="1">First tab content</Tabs.Panel>
          <Tabs.Panel value="2">Second tab content</Tabs.Panel>
          <Tabs.Panel value="3">Third tab content</Tabs.Panel>
        </Tabs>
      </Group>
    </Container>
  );
};
