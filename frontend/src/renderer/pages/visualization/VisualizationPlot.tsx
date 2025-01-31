import { Text } from "@mantine/core";
import { SimplePlot } from "../../components";
import { DataPlot } from "src/renderer/types";
import { useEffect, useState } from "react";

export const VisualizationPlot = () => {

  const [rawData, setRawData] = useState<DataPlot[]>([]);

  const uri1 = "imas:hdf5?user=public;pulse=135011;run=7;database=iterdb;version=3#core_profiles:0/global_quantities/ip"
  const uri2 = "imas:hdf5?user=public;pulse=135011;run=7;database=iterdb;version=3#core_profiles:0/time"

  const fetchFieldValue = async (uri: string) => {
    try {
      const response = await fetch(
        `${window.env.API_URL}/ids_info/field_value/?uri=${encodeURIComponent(uri)}`,
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
  }

  useEffect(() => {
    const fetchData = async () => {
      const data1 = await fetchFieldValue(uri1);
      const data2 = await fetchFieldValue(uri2);

      const dataPlot: DataPlot = {
        nameNode: "Node Exemple",
        valueX: data1.value,
        valueY: data2.value,
      }

      setRawData([dataPlot]);
    }

    fetchData();
  }, [
    uri1,
    uri2,
  ]);
  
// const rawData: DataPlot[] = [
//   {
//     nameNode: "Node1",
//     valueX: [1000, 2000, 3000],
//     valueY: [2400, 1398, 9800],
//   }
// ];

  return(
    <div>
      <Text>VisualizationPlot</Text>
      <SimplePlot
          data={rawData}
          xAxisName="global_quantities/ip"
          yAxisName="time"
          height={400}
        />
    </div>
  )
};