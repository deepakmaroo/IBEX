import {
  Accordion,
  ActionIcon,
  Container,
  Grid,
  ScrollArea,
  Stack,
  Tabs,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { useIbexStore } from '../../stores';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SimplePlotly, TabsListCustom } from '../../components';
import { Configuration, DataGridPlot, DataPlotly } from 'src/renderer/types';
import { CustomizeDownsampling, CustomizeTitle } from './customizableElements';
interface CustomizationProps {
  customizedDataGrid: DataGridPlot;
  setCustomizedDataGrid: React.Dispatch<React.SetStateAction<DataGridPlot>>;
}
const Customization = ({
  customizedDataGrid,
  setCustomizedDataGrid,
}: CustomizationProps) => {
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
        <CustomizeTitle
          customizedDataGrid={customizedDataGrid}
          setCustomizedDataGrid={setCustomizedDataGrid}
        />
      ),
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
      description: (
        <CustomizeDownsampling
          customizedDataGrid={customizedDataGrid}
          setCustomizedDataGrid={setCustomizedDataGrid}
        />
      ),
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
      <ScrollArea h="79vh">
        <Accordion>{items}</Accordion>
      </ScrollArea>
    </Stack>
  );
};

export const DataplotCustomization = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const WIDTH_PLOT = Math.floor(containerWidth * (6 / 12));
  const HEIGHT_PLOT = 390;
  const { active, updatedConfiguration } = useIbexStore();
  const [tabsValue, setTabsValue] = useState<string | null>();
  const [customizedDataGrid, setCustomizedDataGrid] =
    useState<DataGridPlot | null>(null);
  const [dataGridLayout, setDataGridLayout] = useState<DataGridPlot | null>(
    null,
  );

  useEffect(() => {
    // Update dataGridLayout when customizedDataGrid changes
    setDataGridLayout({
      ...dataGridLayout,
      title: customizedDataGrid?.title,
      downsampled_method: customizedDataGrid?.downsampled_method,
      plot: customizedDataGrid?.plot,
    });
  }, [customizedDataGrid]);

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
        setCustomizedDataGrid(data);
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
   * Handle close of customization
   */
  const closeWithoutSaving = useCallback(() => {
    const updatedActive: Configuration = {
      ...active,
      customizedGridLayout: null,
    };
    updatedConfiguration(updatedActive);
  }, [active]);

  /**
   * Handle save & close of customization
   */
  const saveAndClose = useCallback(() => {
    const updatedActive: Configuration = {
      ...active,
      customizedGridLayout: null,
    };
    const updatedDataPlot: DataGridPlot[] = [
      ...updatedActive.dataPlot.filter(
        (dp) => dp.i !== active.customizedGridLayout,
      ),
      customizedDataGrid,
    ];

    updatedConfiguration({ ...updatedActive, dataPlot: updatedDataPlot });
  }, [active, customizedDataGrid]);

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
          setCustomizedDataGrid(dataGridLayout);
        }
      }
    },
    [dataGridLayout, setCustomizedDataGrid],
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
          usedFor="personalization"
          closeWithoutSaving={closeWithoutSaving}
          saveAndClose={saveAndClose}
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
                          itemDataGrid={customizedDataGrid}
                          width={WIDTH_PLOT}
                          height={HEIGHT_PLOT}
                          showSliders={false}
                        />
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <Customization
                          customizedDataGrid={customizedDataGrid}
                          setCustomizedDataGrid={setCustomizedDataGrid}
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
