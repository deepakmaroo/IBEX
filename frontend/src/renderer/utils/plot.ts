import { showNotification } from '@mantine/notifications';
import {
  Axis,
  Configuration,
  DataGridPlot,
  DataPlotly,
  URIData,
} from '../types';
import { fetchDataPlot } from './fetchData';
import { generateUuid } from './uuid';

export const generateNewPlot = (
  title: string,
  xAxis: Axis,
  yAxis: Axis,
  y2Axis?: Axis,
): DataGridPlot => {
  return {
    title: title,
    i: generateUuid(),
    static: false,
    plot: [],
    xAxis: xAxis,
    yAxis: yAxis,
    y2Axis: y2Axis,
    isEditing: true,

    x: 0,
    y: 0,
    w: 6,
    h: 12,
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
  dimensions: number,
  path: string,
  shape: number[],
  labelUri: string,
  description?: string,
  y2Axis?: boolean,
): Promise<DataGridPlot> {
  const trace: DataPlotly = {
    x: xData,
    y: yData,
    name: `${yName}(${unit})_${labelUri}`,
    mode: 'lines',
    nodeUri: nodeUri,
    yUnit: unit,
    description: description,
    path: path,
    dimensions: dimensions,
    shape: shape,
    labelUri: labelUri,
    yaxis: y2Axis ? 'y2' : '',
  };

  if (y2Axis) {
    dataPlot = {
      ...dataPlot,
      title: `${title}`,
    };
  }

  if (yData.length === 0) {
    showNotification({
      title: 'Plot',
      message: `No data to plot for ${yName}(${unit})`,
      color: 'yellow',
    });
  }

  dataPlot.plot.push(trace);

  return dataPlot;
}

export const handleNewPlot = async (
  nodes: URIData[],
  updatedActive: Configuration,
): Promise<Configuration> => {
  const response = await fetchDataPlot(nodes[0].uri);

  if (!response || response.data.ndim !== 1) {
    showNotification({
      title: 'Plot',
      message: 'Cannot plot data with more than one dimension',
      color: 'yellow',
    });
    updatedActive.checkedNodeURI = nodes.filter((n) => n !== nodes[0]);
    return updatedActive;
  }

  const xAxis: Axis = {
    name: response.data.coordinates[0].name,
    unit: response.data.coordinates[0].unit,
    path: response.data.coordinates[0].path,
  };

  const yAxis: Axis = {
    name: response.data.name,
    unit: response.data.unit,
  };

  const newPlot = generateNewPlot(
    `${response.data.name}(${response.data.unit})`,
    xAxis,
    yAxis,
  );

  const updatedPlot = await plotData(
    `${response.data.name}(${response.data.unit})`,
    newPlot,
    response.data.coordinates[0].value as number[],
    response.data.value,
    nodes[0].uri,
    response.data.name,
    response.data.unit,
    response.data.ndim,
    response.data.path,
    response.data.shape,
    nodes[0].name,
    response.data.description,
  );

  updatedActive.dataPlot.push(updatedPlot);
  return updatedActive;
};

export const handleExistingPlot = async (
  nodes: URIData[],
  findDataPlot: DataGridPlot,
  updatedActive: Configuration,
): Promise<Configuration> => {
  const dataToPlot = nodes.filter(
    (node) =>
      !findDataPlot.plot.some(
        (plot) => plot.nodeUri === node.uri && plot.labelUri === node.name,
      ),
  );

  if (dataToPlot.length === 0) {
    return updateExistingPlots(nodes, findDataPlot, updatedActive);
  }


  for (const node of dataToPlot) {
    const response = await fetchDataPlot(node.uri);
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
    const unitExists =
      findDataPlot.yAxis.unit === unit ||
      (findDataPlot.y2Axis && findDataPlot.y2Axis.unit === unit);

    const title = `${findDataPlot.title}/ ${response.data.name}(${unit})`;

    const xAxisMatched =
      findDataPlot.xAxis.name === response.data.coordinates[0].name &&
      findDataPlot.xAxis.unit === response.data.coordinates[0].unit &&
      response.data.coordinates[0].path === findDataPlot.xAxis.path;

    if (!xAxisMatched) {
      showNotification({
        title: 'Plot',
        message: 'X axis does not match',
        color: 'yellow',
      });
      updatedActive.checkedNodeURI = nodes.filter((n) => n !== node);
      continue;
    }

    if (unitExists) {
      const updatedPlot = await plotData(
        title,
        findDataPlot,
        response.data.coordinates[0].value as number[],
        response.data.value,
        node.uri,
        response.data.name,
        unit,
        response.data.ndim,
        response.data.path,
        response.data.shape,
        node.name,
        response.data.description,
      );
      updatedActive.dataPlot = [
        ...(updatedActive.dataPlot || []).filter(
          (plot) => plot.i !== findDataPlot.i,
        ),
        updatedPlot,
      ];
    } else if (!findDataPlot.y2Axis) {
      findDataPlot.y2Axis = {
        name: unit,
        unit: unit,
      };

      const updatedPlot = await plotData(
        title,
        findDataPlot,
        response.data.coordinates[0].value as number[],
        response.data.value,
        node.uri,
        response.data.name,
        unit,
        response.data.ndim,
        response.data.path,
        response.data.shape,
        node.name,
        response.data.description,
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
  nodes: URIData[],
  findDataPlot: DataGridPlot,
  updatedActive: Configuration,
): Configuration => {
  const plots = findDataPlot?.plot.filter((plot) =>
    nodes.some(
      (node) => node.uri === plot.nodeUri && node.name === plot.labelUri,
    ),
  );
  if (plots.every((plot) => plot.yUnit === plots[0].yUnit)) {
    findDataPlot.yAxis = {
      name: plots[0].yUnit,
      unit: plots[0].yUnit,
    };
    findDataPlot.y2Axis = undefined;

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
  dataGridPlot: DataGridPlot[],
): Promise<DataGridPlot[]> {
  try {
    let errorHasOccurred = false;

    const updatedDataGridPlot: DataGridPlot[] = await Promise.all(
      dataGridPlot.map(async (dataGrid): Promise<DataGridPlot> => {
        const updatedPlot = await Promise.all(
          dataGrid.plot.map(async (plot): Promise<DataPlotly> => {
            if (!plot.nodeUri) return plot;

            try {
              const response = await fetchDataPlot(plot.nodeUri);
              if (!response || !response.data) {
                console.warn(`No data returned for nodeUri: ${plot.nodeUri}`);
                errorHasOccurred = true;
                return plot;
              }

              return {
                ...plot,
                name: `${response.data.name}(${response.data.unit})_${plot.labelUri}`,
                yUnit: response.data.unit,
                description: response.data.description,
                dimensions: response.data.ndim,
                path: response.data.path,
                shape: response.data.shape,
                x: response.data.coordinates?.[0]?.value?.map(String) ?? [],
                y: response.data.value ?? [],
              };
            } catch (error) {
              console.error(`Error fetching data for ${plot.nodeUri}:`, error);
              errorHasOccurred = true;
              return plot; // Retourne l'original si une erreur survient
            }
          }),
        );

        return {
          ...dataGrid,
          plot: updatedPlot,
        };
      }),
    );

    if (errorHasOccurred) {
      showNotification({
        title: 'Plot',
        message: 'Some plots could not be loaded',
        color: 'red',
      });
    }

    return updatedDataGridPlot;
  } catch (error) {
    console.error('Error in plotNodeUriLoaded:', error);
    showNotification({
      title: 'Plot',
      message: 'Failed to load plot data',
      color: 'red',
    });

    return [];
  }
}
