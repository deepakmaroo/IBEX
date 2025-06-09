import { showNotification } from '@mantine/notifications';
import {
  Axis,
  Configuration,
  Coordinates,
  DataGridPlot,
  DataPlotly,
  PlotCoordinatesResponse,
  URITreeNodeData,
} from '../types';
import { fetchDataPlot } from './fetchData';
import { generateNewGrid } from './grid';

export function normalizeIndices(uri: string): string {
  return uri.replace(/\[\d+\]/g, '[:]');
}

export async function plotData(
  dataPlot: DataGridPlot,
  xData: number[],
  yData: number[],
  nodeUri: string,
  yAxis: Axis,
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
    name: `${yAxis.name}(${yAxis.unit})_${labelUri}`,
    mode: "lines+markers",
    nodeUri: nodeUri,
    yAxis: yAxis,
    description: description,
    path: path,
    dimensions: dimensions,
    shape: shape,
    labelUri: labelUri,
    yaxis: y2Axis ? 'y2' : '',
  };

  dataPlot = {
    ...dataPlot,
    title:
      dataPlot.title === ''
        ? `${trace.name}`
        : `${dataPlot.title} / ${trace.name}`,
  };

  if (yData.length === 0) {
    showNotification({
      title: 'Plot',
      message: `No data to plot for ${trace.name}`,
      color: 'yellow',
    });
  }

  dataPlot.plot.push(trace);

  return dataPlot;
}

export const handleNewPlot = async (
  nodes: URITreeNodeData[],
  updatedActive: Configuration,
): Promise<Configuration> => {
  const defaultUri = nodes[0].uri.replace(/\[:\]/g, '[0]');

  const response = await fetchDataPlot(defaultUri);

  if (!response || response.data.ndim !== 1) {
    showNotification({
      title: 'Plot',
      message: 'Cannot plot data with more than one dimension',
      color: 'yellow',
    });
    updatedActive.checkedNodeURI = nodes.filter((n) => n !== nodes[0]);
    return updatedActive;
  }

  //Get coordinates data for slider - all coordinates except the first one, is considered as x coordinates
  const xCoordinatesData: Coordinates[] = response.data.coordinates
    .slice(1)
    .map((coordinate: PlotCoordinatesResponse) => ({
      name: coordinate.name,
      shape: coordinate.shape,
      data: coordinate.value as number[],
      value: coordinate.value[0] as number,
      target: coordinate.target,
      nodeUri: defaultUri,
    }));

  const xAxis: Axis = {
    name: response.data.coordinates[0].name,
    unit: response.data.coordinates[0].unit,
    path: response.data.coordinates[0].path,
  };

  const yAxis: Axis = {
    name: response.data.name,
    unit: response.data.unit,
  };

  const newPlot = generateNewGrid(
    `${response.data.name}(${response.data.unit})`,
    xCoordinatesData,
    xAxis,
    yAxis,
  );

  const xCoordinatesValue = response.data.coordinates[0].value as number[];

  const updatedPlot = await plotData(
    newPlot,
    xCoordinatesValue,
    response.data.value,
    defaultUri,
    yAxis,
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
  nodes: URITreeNodeData[],
  findDataPlot: DataGridPlot,
  updatedActive: Configuration,
): Promise<Configuration> => {
  const dataToPlot = nodes.filter(
    (node) =>
      !findDataPlot.plot.some(
        (plot) =>
          normalizeIndices(plot.nodeUri) === node.uri &&
          plot.labelUri === node.name,
      ),
  );

  if (dataToPlot.length === 0) {
    return updateExistingPlots(nodes, findDataPlot, updatedActive);
  }

  for (const node of dataToPlot) {
    if (findDataPlot.coordinates && findDataPlot.coordinates.length > 0) {
      updatedActive.checkedNodeURI = nodes.filter((n) => n !== node);
      showNotification({
        title: 'Plot',
        message: 'Cannot add data to a plot with multiple coordinates',
        color: 'yellow',
      });
      return updatedActive;
    }

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

    const yAxis = {
      name: response.data.name,
      unit: unit,
    };

    if (unitExists) {
      const updatedPlot = await plotData(
        findDataPlot,
        response.data.coordinates[0].value as number[],
        response.data.value,
        node.uri,
        yAxis,
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
        findDataPlot,
        response.data.coordinates[0].value as number[],
        response.data.value,
        node.uri,
        yAxis,
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
  nodes: URITreeNodeData[],
  findDataPlot: DataGridPlot,
  updatedActive: Configuration,
): Configuration => {
  const plots = findDataPlot?.plot.filter((plot) =>
    nodes.some(
      (node) => node.uri === plot.nodeUri && node.name === plot.labelUri,
    ),
  );
  if (plots.every((plot) => plot.yAxis.unit === plots[0].yAxis.unit)) {
    findDataPlot.yAxis = plots[0].yAxis;
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

              const yAxis: Axis = {
                name: response.data.name,
                unit: response.data.unit,
              };

              if (dataGrid.coordinates.length > 0) {
                for (const responseCoordinates of response.data.coordinates.slice(
                  1,
                )) {
                  const findCoordinates = dataGrid.coordinates.find((coord) => {
                    return coord.target == responseCoordinates.target;
                  });

                  if (findCoordinates) {
                    (findCoordinates.data =
                      responseCoordinates.value as number[]),
                      (findCoordinates.name = responseCoordinates.name);
                    findCoordinates.shape = responseCoordinates.shape;
                  }

                  dataGrid.coordinates = dataGrid.coordinates.map((coord) => {
                    if (coord.target === findCoordinates.target) {
                      return findCoordinates;
                    }
                    return coord;
                  });
                }
              } else {
                for (const responseCoordinates of response.data.coordinates.slice(
                  1,
                )) {
                  //Create new coordinates if coordinates do not exist in this configuration saved
                  dataGrid.coordinates.push({
                    name: responseCoordinates.name,
                    shape: responseCoordinates.shape,
                    data: responseCoordinates.value as number[],
                    target: responseCoordinates.target,
                    nodeUri: plot.nodeUri,
                    value: 0,
                  });
                }
              }

              return {
                ...plot,
                name: `${response.data.name}(${response.data.unit})_${plot.labelUri}`,
                yAxis: yAxis,
                description: response.data.description,
                dimensions: response.data.ndim,
                path: response.data.path,
                shape: [],
                x: response.data.coordinates[0].value.map(String) ?? [],
                y: response.data.value ?? [],
              };
            } catch (error) {
              console.error(`Error fetching data for ${plot.nodeUri}:`, error);
              errorHasOccurred = true;
              return plot; // Retourne l'original si une erreur survient
            }
          }),
        );

        const dataGridUpdated = {
          ...dataGrid,
          plot: updatedPlot,
        };

        return dataGridUpdated;
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

    return dataGridPlot;
  }
}
