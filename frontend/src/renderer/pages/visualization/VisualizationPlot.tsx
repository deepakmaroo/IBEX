import { Stack, Text } from '@mantine/core';
import { SimplePlot, SimplePlotly } from '../../components';
import { DataPlot, NodeInfoResponse } from 'src/renderer/types';
import { useEffect, useState } from 'react';
import { useIbexStore } from '../../stores';
import { Data } from 'plotly.js';
import { fetchNodeInfos } from './utils';
interface DataSimplePlot {
  static: boolean;
  plot: Data[];
  title: string;
}

export const VisualizationPlot = () => {
  const { active } = useIbexStore();
  const [rawData, setRawData] = useState<DataSimplePlot[]>([]);
  // const [dataPlot, setDataPlot] = useState<Data>();

  useEffect(() => {

    const fetchData = async () => {
      if (active?.checkedNodeByURI && active.checkedNodeByURI.length > 0) {
        console.log('active.checkedNodes', active.checkedNodeByURI);

        for (const uri of active.checkedNodeByURI) {
          for (const yUri of uri.checkedNodes) {

            console.log('1st request : y nodes infos');
            const nodesInfos: NodeInfoResponse = await fetchNodeInfos(yUri);
            console.log('nodesInfos', nodesInfos);

            const uriWithIds = yUri.split('/')[0];
            const xAxisUri = `${uriWithIds}/${nodesInfos.coordinates[0]}`;
            console.log('xAxisUri Value', xAxisUri);

            console.log ('2nd request : xAxisUri', xAxisUri);
            const responseXAxis = await fetchFieldValue(xAxisUri);
            console.log('responseXAxis', responseXAxis);

            console.log ('3rd request : yUri', yUri);
            const responseYURI = await fetchFieldValue(yUri);
            console.log('responseYURI', responseYURI);



          }

        }
      }
    }

    fetchData();
  }, [active.checkedNodeByURI]);


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
    console.log('dataFormPlot', active.dataFormPlot);
    const newDataSimplePlot: DataSimplePlot[] = [];

    if (active.dataFormPlot) {
      for (const dataForm of active.dataFormPlot) {
        const dataSimplePlot: DataSimplePlot = {
          title: dataForm.titleForm,
          static: true,
          plot: [],
        };
        for (const coordinate of dataForm.coordinates) {
          const data_axeY = await fetchFieldValue(coordinate.axeY);
          const data_axeX = await fetchFieldValue(coordinate.axeY);
          const dataPlot: Data = {
            x: data_axeX.value,
            y: data_axeY.value,
            mode: 'lines',
            name: coordinate.nameNode,
          };
          dataSimplePlot.plot.push(dataPlot);
        }
      }
    }

    //   setRawData(dataChart);
    //   closeCustomPlotModal();
    // }
  }


  return rawData.length > 0 ? (
    <>
      {
        // rawData.map(())
      }
    </>
  ) : (
    <Stack h="100%" align="center" w="100%" justify="center">
      <Text>No chart generates</Text>
    </Stack>
  );
};
