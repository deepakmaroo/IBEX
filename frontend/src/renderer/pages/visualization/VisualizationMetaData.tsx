import {
  Center,
  Container,
  Grid,
  Paper,
  ScrollArea,
  Table,
  Tabs,
} from '@mantine/core';
import { useIbexStore } from '../../stores';
import { useCallback, useEffect, useState } from 'react';
import { SimplePlotly, TabsListCustom } from '../../components';
import { Configuration, DataGridPlot, DataPlotly } from 'src/renderer/types';

interface MetaDataInfosProps {
  data: DataPlotly;
  height?: string;
}

const MetaDataInfos = ({ data, height }: MetaDataInfosProps) => {
  const renderField = (label: string, value?: string | number) =>
    value && (
      <Table.Tr>
        <Table.Td fw="bold">{label}</Table.Td>
        <Table.Td>{value}</Table.Td>
      </Table.Tr>
    );

  return (
    <ScrollArea h={height || '79vh'}>
      <Table py="md">
        <Table.Tbody>
          {renderField('Path', data?.path)}
          {renderField('Name', data?.name)}
          {renderField('Uri', data?.nodeUri)}
          {renderField('Dimension', data?.dimensions)}
          {renderField('Unit', data?.unit)}
          {renderField('Description', data?.description)}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
};

export const VisualizationMetaData = () => {
  const HEIGHT = '79vh';
  const WIDTH_PLOT = 610;
  const HEIGHT_PLOT = 390;
  const { active, updatedConfiguration } = useIbexStore();
  const [tabsValue, setTabsValue] = useState<string | null>();
  const [dataGridLayout, setDataGridLayout] = useState<DataGridPlot>(null);

  /**
   * Handle find grid layout corresponding to the selected tab
   */
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

  /**
   * Handle the switch grid event
   */
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
              <Grid type="container">
                <Grid.Col span={5}>
                  <Center h={HEIGHT}>
                    <Paper
                      style={{
                        height: HEIGHT_PLOT,
                      }}
                      shadow="md"
                      radius="md"
                    >
                      <SimplePlotly
                        data={[item]}
                        width={WIDTH_PLOT}
                        height={HEIGHT_PLOT}
                        isStatic={true}
                        title={item.name}
                        xAxisName={dataGridLayout.xAxisName}
                        yAxisName={item.unit}
                      />
                    </Paper>
                  </Center>
                </Grid.Col>
                <Grid.Col span={7}>
                  <MetaDataInfos data={item} height={HEIGHT} />
                </Grid.Col>
              </Grid>
            </Tabs.Panel>
          ))}
        </Tabs>
      </Container>
    )
  );
};
