import { Paper, ScrollArea, Stack, Text } from '@mantine/core';
import { useIbexStore } from '../../stores';
import GridLayout from 'react-grid-layout';
import { SimplePlotly } from '../../components/plot/SimplePlotly';
import { useCallback, useState } from 'react';
import { Configuration, DataGridPlot } from 'src/renderer/types';
import { Layout } from 'react-grid-layout';

export const VisualizationPlot = () => {
  const { active, updatedConfiguration } = useIbexStore();

  const [dragEnabled, setDragEnabled] = useState(true);
  const [dragTimeout, setDragTimeout] = useState<NodeJS.Timeout | null>(null);

  /**
   * Handle the mouse down event
   */
  const handleMouseDown = () => {
    if (dragTimeout) clearTimeout(dragTimeout);
    setDragEnabled(false);

    const timeoutId = setTimeout(() => {
      setDragEnabled(true);
    }, 3000);

    setDragTimeout(timeoutId);
  };

  /**
   * Handle the mouse up event
   */
  const handleMouseUp = () => {
    if (dragTimeout) clearTimeout(dragTimeout);
    setDragEnabled(true);
  };

  /**
   * Handle the drag static event
   */
  const handleDragStatic = useCallback(
    (id: string) => {
      const newDataPlot: DataGridPlot[] = active.dataPlot.map(
        (item: DataGridPlot) => {
          if (item.i === id) {
            return { ...item, static: !item.static };
          }
          return item;
        },
      );
      const newActive: Configuration = {
        ...active,
        checkedNodeURI: [],
        dataPlot: newDataPlot,
      };

      updatedConfiguration(newActive);
    },
    [active],
  );

  /**
   * Handle the delete grid event
   */
  const handleDeleteGrid = useCallback(
    (id: string) => {
      const newDataPlot: DataGridPlot[] = active.dataPlot.filter(
        (item: DataGridPlot) => item.i !== id,
      );
      const newActive = { ...active, dataPlot: newDataPlot };

      updatedConfiguration(newActive);
    },
    [active],
  );

  /**
   * Handle update grid layout
   */
  const handleUpdateLayout = useCallback(
    (updatedLayouts: Layout[]) => {
      const updatedDataPlot: DataGridPlot[] = active.dataPlot.map(
        (item: DataGridPlot) => {
          const findUpdatedLayout = updatedLayouts.find(
            (layout) => layout.i === item.i,
          );
          if (findUpdatedLayout) {
            return {
              ...item,
              ...findUpdatedLayout,
              minH: 12,
              minW: 6,
            };
          }
          return item;
        },
      );

      const newActive: Configuration = { ...active, dataPlot: updatedDataPlot };

      updatedConfiguration(newActive);
    },
    [active],
  );

  return active.dataPlot.length > 0 ? (
    <>
      <ScrollArea h="84vh">
        <GridLayout
          cols={12}
          rowHeight={30}
          width={1515}
          autoSize={true}
          onDragStart={handleMouseDown}
          onDragStop={handleMouseUp}
          isDraggable={dragEnabled}
          onLayoutChange={(layout) => handleUpdateLayout(layout)}
        >
          {active.dataPlot.map((plotData: DataGridPlot) => {
            return (
              <Paper
                shadow="sm"
                radius="xs"
                withBorder
                key={plotData.i}
                data-grid={{
                  x: plotData.x,
                  y: plotData.y,
                  w: plotData.w,
                  h: plotData.h,
                  static: plotData.static,
                }}
              >
                <SimplePlotly
                  title={plotData.title}
                  xAxisName={plotData.xAxisName}
                  yAxisName={plotData.yAxisName}
                  y2AxisName={plotData.y2AxisName}
                  data={plotData.plot}
                  isStatic={plotData.static}
                  handleDragStatic={() => handleDragStatic(plotData.i)}
                  handleDeleteGrid={() => handleDeleteGrid(plotData.i)}
                />
              </Paper>
            );
          })}
        </GridLayout>
      </ScrollArea>
    </>
  ) : (
    <Stack h="100%" align="center" w="100%" justify="center">
      <Text>No chart generates</Text>
    </Stack>
  );
};
