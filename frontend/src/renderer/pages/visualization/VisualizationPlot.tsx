import { Text } from '@mantine/core';
import { SimplePlot } from '../../components';
import { DataPlot } from 'src/renderer/types';
import { useEffect, useState } from 'react';

export const VisualizationPlot = () => {
  const [rawData, setRawData] = useState<DataPlot[]>([]);

  const uri1_global_quantities =
    'imas:hdf5?user=public;pulse=135011;run=7;database=iterdb;version=3#core_profiles:0/global_quantities/ip';
  const uri2_time =
    'imas:hdf5?user=public;pulse=135011;run=7;database=iterdb;version=3#core_profiles:0/time';

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

  useEffect(() => {
    const fetchData = async () => {
      const data1_global = await fetchFieldValue(uri1_global_quantities);
      const data2_time = await fetchFieldValue(uri2_time);

      const dataPlot: DataPlot = {
        nameNode: 'Node Global Quantities / Time',
        valueX: data2_time.value,
        valueY: data1_global.value,
      };

      setRawData([dataPlot]);
    };

    fetchData();
  }, [uri1_global_quantities, uri2_time]);

  return (
    <div>
      <Text>VisualizationPlot</Text>
      {/* <SimplePlot
        data={rawData}
        xAxisName="time"
        yAxisName="global_quantities/ip"
        height={400}
      /> */}
    </div>
  );
};
