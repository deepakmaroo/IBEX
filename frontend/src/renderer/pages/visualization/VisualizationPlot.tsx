import { Stack, Text } from '@mantine/core';
import { SimplePlot } from '../../components';
import { DataPlot } from 'src/renderer/types';
import { useEffect, useState } from 'react';
import { useIbexStore } from '../../stores';
import { Data } from 'plotly.js';
import { LineChart } from 'src/renderer/components/plot/SimplePlotly';

interface VisualizationPlotProps {
  closeCustomPlotModal: () => void;
}

export const VisualizationPlot = ({
  closeCustomPlotModal,
}: VisualizationPlotProps) => {
  const { active } = useIbexStore();
  const [rawData, setRawData] = useState<Data[]>([]);
  const [dataPlot, setDataPlot] = useState<Data>();

  const fetchFieldValue = async (uri: string) => {
    try {
      const response = await fetch(
        `${window.env.API_URL}/data/field_value/?uri=${encodeURIComponent(uri)}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch IDS data');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(error);
    }
  };

  async function fetchPlotData() {
    if (active.dataFormPlot?.dataPlot) {
      const tempRawData: Data[] = [];
      for (const dataInPlot of active.dataFormPlot.dataPlot) {
        const data_axeY = await fetchFieldValue(dataInPlot.axeY);
        const data_axeX = await fetchFieldValue(dataInPlot.axeX);

        const dataPlot: Data = {
          x: data_axeX,
          y: data_axeY,
          mode: 'lines',
          name: 'Legend',
          yaxis: undefined,
        };

        tempRawData.push(dataPlot);
      }
      setRawData([...tempRawData]);
      console.log('rawData', rawData);
      closeCustomPlotModal();
    }
  }

  useEffect(() => {
    fetchPlotData();
  }, [active.dataFormPlot]);

  return rawData.length > 0 ? (
    <>
      {/* <SimplePlot
          data={rawData}
          titleForm={active.dataFormPlot.titleForm}
          xAxisName={active.dataFormPlot.titleAxisX}
          yAxisName={active.dataFormPlot.titleAxisY}
          height={400}
        /> */}
      <LineChart
        data={rawData}
        title={"toto"}
        yAxisName={"y"}
        isStatic={true}

      />
    </>
  ) : (
    <Stack h="100%" align="center" w="100%" justify="center">
      <Text>No chart generates</Text>
    </Stack>
  );
};
