import { Stack, Text } from '@mantine/core';
import { useIbexStore } from '../../stores';
import GridLayout from 'react-grid-layout';
import { SimplePlotly } from '../../components/plot/SimplePlotly';
import { useCallback, useState } from 'react';
import { Configuration, DataGridPlot } from 'src/renderer/types';

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

  return active.dataPlot.length > 0 ? (
    <>
      <GridLayout
        cols={12}
        rowHeight={30}
        width={1850}
        autoSize={true}
        onDragStart={handleMouseDown}
        onDragStop={handleMouseUp}
        isDraggable={dragEnabled}
      >
        {active.dataPlot.map((plotData: DataGridPlot) => (
          <div
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
              yAxisName={plotData.yAxisName}
              data={plotData.plot}
              isStatic={plotData.static}
              handleDragStatic={() => handleDragStatic(plotData.i)}
              handleDeleteGrid={() => handleDeleteGrid(plotData.i)}
            />
          </div>
        ))}
      </GridLayout>
    </>
  ) : (
    <Stack h="100%" align="center" w="100%" justify="center">
      <Text>No chart generates</Text>
    </Stack>
  );
};
