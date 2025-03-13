import { Stack, Text } from '@mantine/core';
import { SimplePlotly } from '../../components';
import {
  DataPlot,
  FieldValueResponse,
  NodeInfoResponse,
} from 'src/renderer/types';
import { useEffect } from 'react';
import { useIbexStore } from '../../stores';
import { Data } from 'plotly.js';
import { fetchNodeInfos } from './utils';

export const VisualizationPlot = () => {
  const { active, updatedConfiguration, setActive } = useIbexStore();
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

            console.log('2nd request : xAxisUri', xAxisUri);
            const responseXAxis = await fetchFieldValue(xAxisUri);
            console.log('responseXAxis', responseXAxis);

            console.log('3rd request : yUri', yUri);
            const responseYURI = await fetchFieldValue(yUri);
            console.log('responseYURI', responseYURI);

            if (responseXAxis && responseYURI) {
              plotData(
                responseXAxis.values,
                responseYURI.values,
                nodesInfos.name,
                nodesInfos.name,
              );
            }
          }
        }
      }
    };

    fetchData();
  }, [active.checkedNodeByURI]);

  const fetchFieldValue = async (uri: string): Promise<FieldValueResponse> => {
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

  async function plotData(
    xData: number[],
    yData: number[],
    name: string,
    yAxisName: string,
  ) {
    const plot: Data = {
      x: xData,
      y: yData,
      mode: 'lines',
      name: name,
    };

    const dataPlot: DataPlot = {
      static: false,
      plot: [plot],
      title: name,
      yAxisName: yAxisName,
    };
    const updateActive = {
      ...active,
      dataPlot: [...active.dataPlot, dataPlot],
    };
    updatedConfiguration(updateActive);
    setActive(updateActive.name);
  }

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
