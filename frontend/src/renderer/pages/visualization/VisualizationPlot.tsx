import { Stack, Text } from '@mantine/core';
import { useIbexStore } from '../../stores';
import GridLayout from 'react-grid-layout';
import { SimplePlotly } from 'src/renderer/components';

export const VisualizationPlot = () => {
  const { active } = useIbexStore();

  return active.dataPlot.length > 0 ? (
    <>
      <GridLayout
        cols={12}
        rowHeight={30}
        width={1850}
        autoSize={true}
        // onLayoutChange={(layout) => updateData(layout)}
      >
        {active.dataPlot.map((plotData, index) => (
          <SimplePlotly
            key={index}
            title={plotData.title}
            yAxisName={plotData.yAxisName}
            data={plotData.plot}
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
