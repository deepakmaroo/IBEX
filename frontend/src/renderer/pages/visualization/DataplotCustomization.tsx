import {
  Accordion,
  ActionIcon,
  Container,
  Grid,
  ScrollArea,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useIbexStore } from '../../stores';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SimplePlotly, TabsListCustom } from '../../components';
import {
  Configuration,
  DataGridPlot,
  DataPlotly,
  Axis,
} from 'src/renderer/types';

interface CustomizationProps {
  gridLayoutKey: string;
  itemDataGrid: DataGridPlot;
  data: DataPlotly;
  yAxis: Axis;
  tabsSelected: string | null;
  height?: string;
}

const Customization = ({
  gridLayoutKey,
  itemDataGrid,
  data,
  yAxis,
  height,
  tabsSelected,
}: CustomizationProps) => {
  useEffect(() => {
    console.log("data : ", data);
  }, [data]);
  
  type accordionItemsType = {
    value: string;
    description: JSX.Element;
    icon?: JSX.Element;
    disabled?: boolean;
  };
  const accordionItems: accordionItemsType[] = [
    {
      value: 'Title',
      description: (
        <TextInput
          label="Plot title"
          description="Customised the title"
          placeholder="Enter the title"
          defaultValue={itemDataGrid.title}
        />
      ),
      disabled: true,
    },
    {
      value: '1D plots',
      description: <></>,
      icon: (
        <ActionIcon variant="filled" component="span">
          <Text fw="bold">1D</Text>
        </ActionIcon>
      ),
      disabled: true,
    },
    {
      value: 'Heatmap',
      description: <></>,
      icon: (
        <ActionIcon variant="filled" component="span">
          <svg width="50" height="50" viewBox="0 0 50 50">
            <rect x="0" y="0" width="15" height="15" fill="#440154" />
            <rect x="17" y="0" width="15" height="15" fill="#31688e" />
            <rect x="34" y="0" width="15" height="15" fill="#35b779" />

            <rect x="0" y="17" width="15" height="15" fill="#fde725" />
            <rect x="17" y="17" width="15" height="15" fill="#440154" />
            <rect x="34" y="17" width="15" height="15" fill="#31688e" />

            <rect x="0" y="34" width="15" height="15" fill="#35b779" />
            <rect x="17" y="34" width="15" height="15" fill="#fde725" />
            <rect x="34" y="34" width="15" height="15" fill="#440154" />
          </svg>
        </ActionIcon>
      ),
      disabled: true,
    },
    {
      value: 'Data range',
      description: <></>,
      disabled: true,
    },
    {
      value: 'Downsampling',
      description: <></>,
      disabled: true,
    },
    {
      value: 'Dataplots synchronization',
      description: <></>,
      disabled: true,
    },
  ];

  const items = accordionItems.map((item) => (
    <Tooltip
      key={item.value}
      label={item?.disabled ? 'This feature will be available soon' : ''}
      position="bottom-start"
      opened={item?.disabled ? null : false}
    >
      <Accordion.Item value={item.value}>
        <Accordion.Control icon={item.icon} disabled={item?.disabled || false}>
          {item.value}
        </Accordion.Control>
        <Accordion.Panel>{item.description}</Accordion.Panel>
      </Accordion.Item>
    </Tooltip>
  ));

  return (
    <Stack gap={0}>
      <Title ta={'center'} order={3} pt={10}>
        Personalisation
      </Title>
      <ScrollArea h={height || '79vh'}>
        <Accordion>{items}</Accordion>
      </ScrollArea>
    </Stack>
  );
};

export const DataplotCustomization = () => {
  const HEIGHT = '79vh';
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const WIDTH_PLOT = Math.floor(containerWidth * (6 / 12));
  const HEIGHT_PLOT = 390;
  const { active, updatedConfiguration } = useIbexStore();
  const [tabsValue, setTabsValue] = useState<string | null>();
  const [itemDataGrid, setItemDataGrid] = useState<DataGridPlot | null>(null);
  const [dataGridLayout, setDataGridLayout] = useState<DataGridPlot | null>(
    null,
  );

  /**
   * Handle find grid layout corresponding to the selected tab
   */
  useEffect(() => {
    if (active?.customizedGridLayout) {
      const data = active.dataPlot.find(
        (item: DataGridPlot) => item.i === active.customizedGridLayout,
      );
      if (data) {
        setDataGridLayout(data);
        setTabsValue(data.plot[0]?.name || null);
        const findPlot = data.plot.find(
          (item) => item.name === data.plot[0]?.name,
        );
        if (findPlot) {
          setItemDataGrid({
            ...data,
            plot: [findPlot],
          });
        }
      }
    }
  }, [active]);

  /**
   * Handle the resizing of the width
   */
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [tabsValue]);

  /**
   * Handle the switch grid event
   */
  const handleSwitchGrid = useCallback(() => {
    const updatedActive: Configuration = {
      ...active,
      customizedGridLayout: null,
    };
    updatedConfiguration(updatedActive);
  }, [active]);

  /**
   * Handle selected tab change
   */
  const handleSelectedTab = useCallback(
    (value: string | null) => {
      setTabsValue(value);
      if (dataGridLayout) {
        const selectedPlot = dataGridLayout.plot.find(
          (item) => item.name === value,
        );
        if (selectedPlot) {
          setItemDataGrid({
            ...dataGridLayout,
            plot: [selectedPlot],
          });
        }
      }
    },
    [dataGridLayout, setItemDataGrid],
  );

  return (
    <Container fluid pb={10}>
      <Tabs value={tabsValue} onChange={(value) => handleSelectedTab(value)}>
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
          dataGridLayout.plot.map((item: DataPlotly, index) => {
            // force to have only one axis in metadata plot
            const itemWithoutY2axis = JSON.parse(JSON.stringify(item));
            if (item.yaxis != '') {
              delete itemWithoutY2axis.yaxis;
            }

            return (
              item?.name && (
                <Tabs.Panel key={index} value={item.name}>
                  {tabsValue === item.name && (
                    <Grid type="container" ref={containerRef}>
                      <Grid.Col span={6}>
                        <SimplePlotly
                          itemDataGrid={itemDataGrid}
                          width={WIDTH_PLOT}
                          height={HEIGHT_PLOT}
                          showSliders={false}
                        />
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Customization
                          gridLayoutKey={dataGridLayout.i}
                          itemDataGrid={itemDataGrid}
                          data={item}
                          yAxis={
                            item.yaxis !== ''
                              ? dataGridLayout.y2AxisData
                              : dataGridLayout.yAxisData
                          }
                          height={HEIGHT}
                          tabsSelected={tabsValue}
                        />
                      </Grid.Col>
                    </Grid>
                  )}
                </Tabs.Panel>
              )
            );
          })}
      </Tabs>
    </Container>
  );
};
