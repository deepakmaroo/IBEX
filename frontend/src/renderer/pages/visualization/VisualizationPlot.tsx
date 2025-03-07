import { Stack, Text } from '@mantine/core';
import { SimplePlot, SimplePlotly } from '../../components';
import { DataPlot } from 'src/renderer/types';
import { useEffect, useState } from 'react';
import { useIbexStore } from '../../stores';
import { Data } from 'plotly.js';

interface VisualizationPlotProps {
  closeCustomPlotModal: () => void;
}

export const VisualizationPlot = ({
  closeCustomPlotModal,
}: VisualizationPlotProps) => {
  const { active } = useIbexStore();
  const [rawData, setRawData] = useState<Data[]>([]);
  // const [dataPlot, setDataPlot] = useState<Data>();

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
      const dataChart: Data[] = [];
      for (const dataInForm of active.dataFormPlot.dataPlot) {
        const data_axeY = await fetchFieldValue(dataInForm.axeY);
        const data_axeX = await fetchFieldValue(dataInForm.axeX);

        const dataPlot: Data = {
          x: data_axeX.value,
          y: data_axeY.value,
          mode: 'lines',
          name: 'Legend',
          yaxis: undefined,
        };

        dataChart.push(dataPlot);
      }
      setRawData(dataChart);
      closeCustomPlotModal();
    }
  }

  useEffect(() => {
    fetchPlotData();
  }, [active.dataFormPlot]);

  return rawData.length > 0 ? (
    <>
      <SimplePlotly
        data={rawData}
        title={'toto title'}
        yAxisName={'yname'}
        isStatic={true}
      />
    </>
  ) : (
    <Stack h="100%" align="center" w="100%" justify="center">
      <Text>No chart generates</Text>
    </Stack>
  );
};
