import { Stack, Text } from '@mantine/core';
import { useIbexStore } from '../../stores';
import GridLayout from 'react-grid-layout';
import { SimplePlotly } from '../../components/plot/SimplePlotly';
import { useCallback } from 'react';
import { DataPlot } from 'src/renderer/types';

export const VisualizationPlot = () => {
  const { active, updatedConfiguration } = useIbexStore();

  const handleDragStatic = useCallback(
    (id: string) => {
      const newDataPlot: DataPlot[] = active.dataPlot.map((item) => {
        if (item.uuid === id) {
          return { ...item, static: !item.static };
        }
        return item;
      });
      const newActive = { ...active, dataPlot: newDataPlot };

      updatedConfiguration(newActive);
    },
    [active],
  );

  const handleDeleteGrid = useCallback((id: string) => {
    const newDataPlot: DataPlot[] = active.dataPlot.filter(
      (item) => item.uuid !== id,
    );
    const newActive = { ...active, dataPlot: newDataPlot };

    updatedConfiguration(newActive);
  }, []);

  return active.dataPlot.length > 0 ? (
    <>
      <GridLayout cols={12} rowHeight={30} width={1850} autoSize={true}>
        {active.dataPlot.map((plotData) => (
          <SimplePlotly
            key={plotData.uuid}
            title={plotData.title}
            yAxisName={plotData.yAxisName}
            data={plotData.plot}
            handleDragStatic={() => handleDragStatic(plotData.uuid)}
            handleDeleteGrid={() => handleDeleteGrid(plotData.uuid)}
          />
        ))}
      </GridLayout>
    </>
  ) : (
    <Stack h="100%" align="center" w="100%" justify="center">
      <Text>No chart generates</Text>
    </Stack>
  );
};
