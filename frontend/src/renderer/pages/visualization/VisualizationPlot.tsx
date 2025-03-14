import { Stack, Text } from '@mantine/core';
import { SimplePlotly } from '../../components';
import { NodeInfoResponse } from 'src/renderer/types';
import { useEffect } from 'react';
import { useIbexStore } from '../../stores';
import { fetchNodeInfos } from './utils';

export const VisualizationPlot = () => {
  const { active} = useIbexStore();
  // const [dataPlot, setDataPlot] = useState<Data>();

  useEffect(() => {
    console.log('active', active);
  }, [active]);


  return active.dataPlot.length > 0 ? (
    <>
      {active.dataPlot.map((plotData, index) => (
        <SimplePlotly
          key={index}
          title={plotData.title}
          yAxisName={plotData.yAxisName}
          data={plotData.plot}
        />
      ))}
    </>
  ) : (
    <Stack h="100%" align="center" w="100%" justify="center">
      <Text>No chart generates</Text>
    </Stack>
  );
};
