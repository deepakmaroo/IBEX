import {
  DataPlot,
  DataPlotly,
  FieldValueResponse,
  NodeInfoResponse,
} from 'src/renderer/types';

const generateUuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const fetchNodeInfos = async (
  nodeUri: string,
  showErrorBars: boolean,
): Promise<NodeInfoResponse> => {
  const response = await fetch(
    `${window.env.API_URL}/ids_info/node_info/?uri=${encodeURIComponent(nodeUri)}&show_error_bars=${showErrorBars}`,
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
};

export const fetchFieldValue = async (
  uri: string,
): Promise<FieldValueResponse> => {
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

export async function plotData(
  xData: number[],
  yData: number[],
  name: string,
  yAxisName: string,
  dataPlot: DataPlot[],
  uriY: string,
): Promise<DataPlot> {
  const plot: DataPlotly = {
    x: xData,
    y: yData,
    mode: 'lines',
    name: name,
    uriY: uriY,
  };

  let newUuid = generateUuid();

  while (dataPlot.find((plot) => plot.uuid === newUuid)) {
    newUuid = generateUuid();
  }

  const newDataPlot: DataPlot = {
    uuid: newUuid,
    static: false,
    plot: [plot],
    title: name,
    yAxisName: yAxisName,
  };

  return newDataPlot;
}
