import { showNotification } from '@mantine/notifications';
import { Configuration, DataGridPlot, DataPlotly } from '../types';
import { fetchDataPlot } from './fetchData';
import { generateUuid } from './uuid';

export const generateNewPlot = (
  title: string,
  xAxisName: string,
  yAxisName: string,
  yUnit: string,
  y2AxisName?: string,
  y2Unit?: string,
): DataGridPlot => {
  return {
    title: title,
    i: generateUuid(),
    static: false,
    plot: [],
    xAxisName: xAxisName,
    yAxisName: yAxisName,
    y2AxisName: y2AxisName,
    yUnit: yUnit,
    y2Unit: y2Unit,
    isEditing: true,

    //default layout position
    x: 0,
    y: 0,
    w: 6,
    h: 12,
    minH: 12,
    minW: 6,
  };
};

export async function plotData(
  title: string,
  dataPlot: DataGridPlot,
  xData: number[],
  yData: number[],
  nodeUri: string,
  yName: string,
  unit: string,
  y2Axis?: boolean,
): Promise<DataGridPlot> {
  const trace: DataPlotly = {
    x: xData,
    y: yData,
    name: yName,
    mode: 'lines',
    nodeUri: nodeUri,
    unit: unit,
  };

  if (y2Axis) {
    trace.yaxis = 'y2';

    dataPlot = {
      ...dataPlot,
      title: `${title}`,
    };
  }

  dataPlot.plot.push(trace);

  return dataPlot;
}

export const handleNewPlot = async (
  nodes: string[],
  updatedActive: Configuration,
): Promise<Configuration> => {
  const response = await fetchDataPlot(nodes[0]);

  if (!response || response.data.ndim !== 1) {
    showNotification({
      title: 'Plot',
      message: 'Cannot plot data with more than one dimension',
      color: 'yellow',
    });
    updatedActive.checkedNodeURI = nodes.filter((n) => n !== nodes[0]);
    return updatedActive;
  }

  const newPlot = generateNewPlot(
    `${response.data.name}(${response.data.unit})`,
    `${response.data.coordinates[0].name}(${response.data.coordinates[0].unit})`,
    response.data.unit,
    response.data.unit,
  );

  const updatedPlot = await plotData(
    `${response.data.name}(${response.data.unit})`,
    newPlot,
    response.data.coordinates[0].value,
    response.data.value[0],
    nodes[0],
    `${response.data.name}(${response.data.unit})`,
    response.data.unit,
  );

  updatedActive.dataPlot.push(updatedPlot);
  return updatedActive;
};

export const handleExistingPlot = async (
  nodes: string[],
  findDataPlot: DataGridPlot,
  updatedActive: Configuration,
): Promise<Configuration> => {
  const dataPlotted = nodes.filter(
    (node) => !findDataPlot.plot.some((plot) => plot.nodeUri === node),
  );

  if (dataPlotted.length === 0) {
    return updateExistingPlots(nodes, findDataPlot, updatedActive);
  }

  for (const node of dataPlotted) {
    const response = await fetchDataPlot(node);
    if (!response || response.data.ndim !== 1) {
      showNotification({
        title: 'Plot',
        message: 'Cannot plot data with more than one dimension',
        color: 'yellow',
      });
      updatedActive.checkedNodeURI = nodes.filter((n) => n !== node);
      continue;
    }

    const unit = response.data.unit;
    const unitIsSame =
      findDataPlot.yUnit === unit || findDataPlot.y2Unit === unit;
    const title = `${findDataPlot.title}/ ${response.data.name}(${unit})`;

    if (unitIsSame) {
      const updatedPlot = await plotData(
        title,
        findDataPlot,
        response.data.coordinates[0].value,
        response.data.value[0],
        node,
        `${response.data.name}(${unit})`,
        unit,
      );
      updatedActive.dataPlot = [
        ...(updatedActive.dataPlot || []).filter(
          (plot) => plot.i !== findDataPlot.i,
        ),
        updatedPlot,
      ];
    } else if (!findDataPlot.y2AxisName) {
      findDataPlot.y2AxisName = unit;
      findDataPlot.y2Unit = unit;
      const updatedPlot = await plotData(
        title,
        findDataPlot,
        response.data.coordinates[0].value,
        response.data.value[0],
        node,
        `${response.data.name}(${unit})`,
        unit,
        true,
      );
      updatedActive.dataPlot = [
        ...(updatedActive.dataPlot || []).filter(
          (plot) => plot.i !== findDataPlot.i,
        ),
        updatedPlot,
      ];
    } else {
      showNotification({
        title: 'Plot',
        message: 'Plot already contains 2 y axes',
        color: 'yellow',
      });
      updatedActive.checkedNodeURI = nodes.filter((n) => n !== node);
    }
  }
  return updatedActive;
};

const updateExistingPlots = (
  nodes: string[],
  findDataPlot: DataGridPlot,
  updatedActive: Configuration,
): Configuration => {
  const plots = findDataPlot?.plot.filter((plot) =>
    nodes.includes(plot.nodeUri),
  );
  if (plots.every((plot) => plot.unit === plots[0].unit)) {
    findDataPlot.yAxisName = plots[0].unit;
    findDataPlot.yUnit = plots[0].unit;
    findDataPlot.y2AxisName = '';
    findDataPlot.y2Unit = '';

    for (const plot of plots) {
      plot.yaxis = '';
    }
  }

  findDataPlot.plot = plots;
  findDataPlot.title = plots.map((plot) => plot.name).join('/');
  updatedActive.dataPlot = [
    ...updatedActive.dataPlot.filter((plot) => plot.i !== findDataPlot.i),
    findDataPlot,
  ];
  return updatedActive;
};

export async function plotNodeUriLoaded(
  dataGrigPlot: DataGridPlot[],
): Promise<DataGridPlot[]> {
  const updatedDataGrigPlot: DataGridPlot[] = await Promise.all(
    dataGrigPlot.map(async (dataGrid: DataGridPlot): Promise<DataGridPlot> => {
      const updatedPlot = await Promise.all(
        dataGrid.plot.map(async (plot): Promise<DataPlotly> => {
          if (plot.nodeUri !== '') {
            const response = await fetchDataPlot(plot.nodeUri);
            return {
              ...plot,
              x: response.data.coordinates[0].value.map((item) =>
                item.toString(),
              ),
              y: response.data.value[0],
            };
          }
          return plot;
        }),
      );

      return {
        ...dataGrid,
        plot: updatedPlot,
      };
    }),
  );

  return updatedDataGrigPlot;
}
