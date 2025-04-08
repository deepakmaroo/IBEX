import { Paper, ScrollArea, Stack, Text } from '@mantine/core';
import { useIbexStore } from '../../stores';
import { SimplePlotly } from '../../components/plot/SimplePlotly';
import { useCallback, useState } from 'react';
import { Configuration, DataGridPlot } from 'src/renderer/types';
import GridLayout, { Layout } from 'react-grid-layout';

export const VisualizationPlot = () => {
  const { active, updatedConfiguration } = useIbexStore();

  const [dragEnabled, setDragEnabled] = useState(true);
  const [dragTimeout, setDragTimeout] = useState<NodeJS.Timeout | null>(null);
  const gridWith = 1580;
  const colsNumber = 12;
  const colWidth = gridWith / colsNumber;
  const rowHeight = 30;

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
      const newActive: Configuration = {
        ...active,
        dataPlot: newDataPlot,
        checkedNodeURI: [],
      };

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

  const handleEditGrid = useCallback(
    (id: string) => {
      const findPlot = active.dataPlot.find((item) => item.i === id);
      console.log('findPlot', findPlot);
      if (!findPlot) return;

      const updatedDataPlot = active.dataPlot.map((item) =>
        item.i === id ? { ...item, isEditing: !item.isEditing } : { ...item, isEditing: false }
      );

      console.log('updated data plot', updatedDataPlot);

      updatedConfiguration({
        ...active,
        dataPlot: updatedDataPlot,
        checkedNodeURI: findPlot.isEditing
          ? []
          : findPlot.plot.map((item) => item.nodeUri),
      });
    },
    [active],
  );

  return active.dataPlot.length > 0 ? (
    <>
      <ScrollArea h="84vh">
        <GridLayout
          cols={colsNumber}
          rowHeight={rowHeight}
          width={gridWith}
          autoSize={true}
          onDragStart={handleMouseDown}
          onDragStop={handleMouseUp}
          isDraggable={dragEnabled}
          onLayoutChange={(layout) => handleUpdateLayout(layout)}
        >
          {active.dataPlot.map((plotData: DataGridPlot) => {
            console.log('plot', plotData);
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
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  boxSizing: 'border-box',
                }}
              >
                <SimplePlotly
                  title={plotData.title}
                  xAxisName={plotData.xAxisName}
                  yAxisName={plotData.yAxisName}
                  y2AxisName={plotData.y2AxisName}
                  width={plotData.w * colWidth - 20}
                  height={plotData.h * rowHeight+ 23*(plotData.h * rowHeight)/100}
                  data={plotData.plot}
                  isStatic={plotData.static}
                  isEdit={plotData.isEditing}
                  handleDragStatic={() => handleDragStatic(plotData.i)}
                  handleDeleteGrid={() => handleDeleteGrid(plotData.i)}
                  handleEditGrid={() => handleEditGrid(plotData.i)}
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
