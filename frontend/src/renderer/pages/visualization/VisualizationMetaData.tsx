import { Container, Tabs } from '@mantine/core';
import { useIbexStore } from '../../stores';
import { useCallback, useEffect, useState } from 'react';
import { TabsListCustom } from '../../components';
import { Configuration, DataGridPlot } from 'src/renderer/types';

export const VisualizationMetaData = () => {
  const { active, updatedConfiguration } = useIbexStore();
  const [tabsValue, setTabsValue] = useState<string | null>();
  const [dataGridLayout, setDataGridLayout] = useState<DataGridPlot>(null);

  useEffect(() => {
    if (active?.gridLayoutSelected) {
      const data = active.dataPlot.find(
        (item: DataGridPlot) => item.i === active.gridLayoutSelected,
      );
      if (data) {
        setDataGridLayout(data);
        setTabsValue(data.plot[0].name);
      }
    }
  }, [active]);

  const handleSwitchGrid = useCallback(() => {
    const updatedActive: Configuration = {
      ...active,
      gridLayoutSelected: null,
    };
    updatedConfiguration(updatedActive);
  }, [active]);

  return (
    dataGridLayout && (
      <Container fluid pb={10}>
        <Tabs value={tabsValue} onChange={setTabsValue}>
          <TabsListCustom
            data={dataGridLayout.plot.map((item) => item.name)}
            value={tabsValue}
            handleSwitchGrid={handleSwitchGrid}
          />

          {dataGridLayout.plot.map((item, index) => (
            <Tabs.Panel key={index} value={item.name}>
              {item.nodeUri}
            </Tabs.Panel>
          ))}
        </Tabs>
      </Container>
    )
  );
};
