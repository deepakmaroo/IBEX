import {
  Accordion,
  AccordionControl,
  Center,
  Container,
  Grid,
  Paper,
  ScrollArea,
  Spoiler,
  Stack,
  Table,
  Tabs,
} from '@mantine/core';
import { useIbexStore } from '../../stores';
import { useCallback, useEffect, useState } from 'react';
import { SimplePlotly, TabsListCustom } from '../../components';
import {
  Configuration,
  DataGridPlot,
  DataPlotly,
  PlotCoordinatesResponse,
} from 'src/renderer/types';
import { fetchDataPlot } from '../../utils';

interface MetaDataInfosProps {
  data: DataPlotly;
  tabsSelected: string | null;
  height?: string;
}

interface RenderMetaDataCoordinatesProps {
  coordinates: PlotCoordinatesResponse[];
}

const renderField = (label: string, value?: string | number) =>
  value && (
    <Table.Tr>
      <Table.Td fw="bold">{label}</Table.Td>
      <Table.Td>{value}</Table.Td>
    </Table.Tr>
  );

const renderSpoiler = (label: string, value?: (string | number)[]) =>
  value && (
    <Table.Tr>
      <Table.Td fw="bold">{label}</Table.Td>
      <Table.Td>
        <ScrollArea h={value.length > 5 ? 150 : 'auto'}>
          <Spoiler
            maxHeight={value.length > 5 ? 150 : 50}
            showLabel="Show more"
            hideLabel="Hide"
          >
            <Stack align="flex-start" gap={1}>
              {value.map((v, i) => (
                <div key={i}>
                  {v}
                  {value.length - 1 !== i ? ',' : ''}
                </div>
              ))}
            </Stack>
          </Spoiler>
        </ScrollArea>
      </Table.Td>
    </Table.Tr>
  );

const RenderMetaDataCoordinates = ({
  coordinates,
}: RenderMetaDataCoordinatesProps) => {
  const content = coordinates.map((coordinate, index) => (
    <Table
      key={index}
      withRowBorders={false}
      styles={{
        td: {
          wordBreak: 'keep-all',
        },
      }}
    >
      <Table.Tbody>
        {renderField('name', coordinate.name)}
        {renderField('target', coordinate.target)}
        {renderField('unit', coordinate.unit)}
        {renderSpoiler('shape', coordinate.shape)}
        {renderField('ndim', coordinate.ndim)}
        {renderField('path', coordinate.path)}
        {renderField('description', coordinate.description)}
        {renderSpoiler('value', coordinate.value)}
      </Table.Tbody>
    </Table>
  ));

  return (
    <Table.Tr>
      <Table.Td fw="bold">Coordinates</Table.Td>
      <Table.Td>
        <Accordion chevronPosition="left" variant="filled">
          {coordinates.map((coordinate, index) => (
            <Accordion.Item key={index} value={coordinate.name}>
              <AccordionControl>{coordinate.name}</AccordionControl>
              <Accordion.Panel>{content}</Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Table.Td>
    </Table.Tr>
  );
};

const MetaDataInfos = ({ data, height, tabsSelected }: MetaDataInfosProps) => {
  const [coordinates, setCoordinates] = useState<PlotCoordinatesResponse[]>([]);

  useEffect(() => {
    const fetchCoordinates = async () => {
      try {
        if (tabsSelected === data.name) {
          const response = await fetchDataPlot(data.nodeUri);

          setCoordinates(response.data.coordinates);
        }
      } catch (error) {
        console.error('Error fetching coordinates:', error);
      }
    };

    fetchCoordinates();
  }, [data.nodeUri, tabsSelected]);

  return (
    <ScrollArea h={height || '79vh'}>
      <Table
        py="md"
        styles={{
          td: {
            wordBreak: 'keep-all',
          },
        }}
      >
        <Table.Tbody>
          {renderField('Path', data?.path)}
          {renderField('Name', data?.name)}
          {renderField('Uri', data?.nodeUri)}
          {renderSpoiler('Shape', data.shape as (string | number)[])}
          {renderField('Dimension', data?.dimensions)}
          {renderSpoiler('value', data.y as (string | number)[])}
          {renderField('Unit', data?.unit)}
          <RenderMetaDataCoordinates coordinates={coordinates} />
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
        setTabsValue(data.plot[0]?.name || null);
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
    <Container fluid pb={10}>
      <Tabs value={tabsValue} onChange={setTabsValue}>
        <TabsListCustom
          data={
            dataGridLayout
              ? dataGridLayout.plot
                  .map((item) => item?.name || '')
                  .filter((item) => item)
              : []
          }
          value={tabsValue}
          handleSwitchGrid={handleSwitchGrid}
        />

        {dataGridLayout &&
          dataGridLayout.plot.map(
            (item, index) =>
              item?.name && (
                <Tabs.Panel key={index} value={item?.name}>
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
                      <MetaDataInfos
                        data={item}
                        height={HEIGHT}
                        tabsSelected={tabsValue}
                      />
                    </Grid.Col>
                  </Grid>
                </Tabs.Panel>
              ),
          )}
      </Tabs>
    </Container>
  );
};
