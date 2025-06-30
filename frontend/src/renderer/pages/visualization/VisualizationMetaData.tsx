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
  Text,
} from '@mantine/core';
import { useIbexStore } from '../../stores';
import { useCallback, useEffect, useState } from 'react';
import { SimplePlotly, TabsListCustom } from '../../components';
import {
  ArraySummaryResponse,
  Configuration,
  DataGridPlot,
  DataPlotly,
  PlotCoordinatesResponse,
} from 'src/renderer/types';
import { fetchArraySummary, fetchDataPlot } from '../../utils';

interface MetaDataInfosProps {
  data: DataPlotly;
  tabsSelected: string | null;
  height?: string;
}

interface RenderMetaDataCoordinatesProps {
  coordinates: PlotCoordinatesResponse[];
}

const renderField = (label: string, value?: string | number) => (
  <Table.Tr>
    <Table.Td fw="bold">{label}</Table.Td>
    <Table.Td>{value ? value : 'N/A'}</Table.Td>
  </Table.Tr>
);

const renderSpoiler = (label: string, value?: (string | number)[]) => (
  <Table.Tr>
    <Table.Td fw="bold">{label}</Table.Td>
    <Table.Td>
      {value === undefined || value.length === 0 ? (
        'N/A'
      ) : (
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
      )}
    </Table.Td>
  </Table.Tr>
);

const RenderMetaDataCoordinates = ({
  coordinates,
}: RenderMetaDataCoordinatesProps) => {
  const renderCoordinates = (coordinate: PlotCoordinatesResponse) => (
    <Table
      withRowBorders={false}
      styles={{
        td: {
          wordBreak: 'keep-all',
        },
      }}
    >
      <Table.Tbody>
        {renderField('name', coordinate.name)}
        {renderField('path', coordinate.path)}
        {renderField('unit', coordinate.unit)}
        {renderSpoiler('shape', coordinate.shape)}
        {renderField('ndim', coordinate.ndim.toString())}

        {renderSpoiler('value', coordinate.value as number[])}

        {renderField('description', coordinate.description)}
        {renderField('target', coordinate.target)}
      </Table.Tbody>
    </Table>
  );

  return (
    <Table.Tr>
      <Table.Td fw="bold">Coordinates</Table.Td>
      <Table.Td>
        {coordinates.length === 0 ? (
          'N/A'
        ) : (
          <Accordion chevronPosition="left" variant="filled">
            {coordinates.map((coordinate, index) => (
              <Accordion.Item key={index} value={coordinate.name}>
                <AccordionControl>{coordinate.name}</AccordionControl>
                <Accordion.Panel>
                  {renderCoordinates(coordinate)}
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        )}
      </Table.Td>
    </Table.Tr>
  );
};

const MetaDataInfos = ({ data, height, tabsSelected }: MetaDataInfosProps) => {
  const [coordinates, setCoordinates] = useState<PlotCoordinatesResponse[]>([]);
  const [summary, setSummary] = useState<ArraySummaryResponse>(null);

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

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        if (tabsSelected === data.name) {
          const response = await fetchArraySummary(data.nodeUri);
          setSummary(response);
        }
      } catch (error) {
        console.error('Error fetching array summary:', error);
      }
    };

    fetchSummary();
  }, [tabsSelected]);

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
          {renderField('uri', data?.nodeUri)}
          {renderField('name', data?.name)}
          {renderField('path', data?.path)}
          {renderField('unit', data.yAxis.unit)}
          {renderSpoiler('shape', data.shape as (string | number)[])}
          {renderField('dimension', data?.dimensions.toString())}
          {renderSpoiler('value', data.y as (string | number)[])}
          {summary && renderField('min', summary?.min)}
          {summary && renderField('max', summary?.max)}
          {summary && renderField('mean', summary?.mean)}
          {summary &&
            renderField('standard_deviation', summary?.standard_deviation)}
          {renderField('description', data?.description)}
          <RenderMetaDataCoordinates coordinates={coordinates} />
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
                            xAxis={dataGridLayout.xAxis}
                            yAxis={
                              item.yaxis !== ''
                                ? dataGridLayout.y2Axis
                                : dataGridLayout.yAxis
                            }
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
