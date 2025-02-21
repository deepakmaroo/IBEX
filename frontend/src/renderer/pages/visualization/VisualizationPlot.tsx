import { Stack, Text } from '@mantine/core';
import { SimplePlot } from '../../components';
import { DataPlot } from 'src/renderer/types';
import { useEffect, useState } from 'react';
import { useIbexStore } from '../../stores';

interface VisualizationPlotProps{
  closeCustomPlotModal: () => void;
}

export const VisualizationPlot = ({closeCustomPlotModal}: VisualizationPlotProps) => {
  const { active } = useIbexStore();
  const [rawData, setRawData] = useState<DataPlot[]>([]);

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
    if(active.dataFormPlot?.dataPlot){
      const tempRawData: DataPlot[] = []
      for (const dataInPlot of active.dataFormPlot.dataPlot) {
        const data_axeY = await fetchFieldValue(dataInPlot.axeY);
        const data_axeX = await fetchFieldValue(dataInPlot.axeX);

        const dataPlot: DataPlot = {
          nameNode: dataInPlot.nameNode,
          valueX: data_axeX.value,
          valueY: data_axeY.value,
        };
        tempRawData.push(dataPlot)
      }
        setRawData([...tempRawData]);
        closeCustomPlotModal();
    }
  }

  useEffect(() => {
    fetchPlotData()
  }, [active.dataFormPlot])

  return (
    rawData.length > 0 ? (
      <>
        <SimplePlot
          data={rawData}
          xAxisName="time"
          yAxisName="global_quantities/ip"
          height={400}
        />
      </>
    ) : (
      <Stack h="100%" align='center' w="100%" justify='center'>
        <Text>No chart generates</Text>
      </Stack>
    )
  );
};
