import { showNotification } from '@mantine/notifications';
import {
  Axis,
  AxisData,
  Configuration,
  Coordinates,
  DataGridPlot,
  DataPlotly,
  PlotCoordinatesResponse,
  PlotDataResponse,
  URITreeNodeData,
} from '../types';
import { fetchDataPlot } from './fetchData';
import { generateNewGridPlot } from './grid';
import { normalizeIndices } from './uri';
import { getFirstArrayValueFromShape } from './matrix';

/**
 * @description Checks if the response data has more than one dimension.
 * If it does, it shows a notification and updates the active configuration to remove the first node.
 * @param response The PlotDataResponse to check.
 * @param updatedActive The updated active configuration.
 * @param nodes The nodes to update.
 * @returns A boolean indicating whether the dimension check passed.
 */
export const checkDimension1 = (
  response: PlotDataResponse,
  updatedActive: Configuration,
  nodes: URITreeNodeData[],
): boolean => {
  if (!response || response.data.ndim > 1) {
    showNotification({
      title: 'Plot',
      message: 'Cannot plot data with more than one dimension',
      color: 'yellow',
    });
    updatedActive.checkedNodeURI = nodes.filter((n) => n !== nodes[0]);
    return false;
  }
  return true;
};

/**
 * @description Generates a new DataGridPlot with the provided coordinates, xAxis, and yAxis.
 * @param coordinates The coordinates to include in the plot.
 * @param xAxis The x-axis data for the plot.
 * @param yAxis The y-axis data for the plot.
 * @param dataPlot The existing DataGridPlot to update or create a new one.
 * @returns A new DataGridPlot object with the provided data.
 */
export const plotData = (
  dataPlot: DataGridPlot,
  name: string,
  xValue: number[],
  yValue: number[],
  yData: AxisData,
  nodeUri: string,
  dimensions: number,
  path: string,
  shape: number[],
  labelUri: string,
  description?: string,
  y2Axis?: boolean,
): DataGridPlot => {
  const trace: DataPlotly = {
    x: xValue,
    y: yValue,
    yData: yData,
    name: name ? `${name}_${labelUri}` : '',
    mode: yValue.length > 1 ? 'lines' : 'lines+markers',
    nodeUri: nodeUri,
    description: description,
    path: path,
    dimensions: dimensions,
    shape: shape,
    labelUri: labelUri,
    yaxis: y2Axis ? 'y2' : '',
  };
  if (yValue.length === 0) {
    showNotification({
      title: 'Plot',
      message: `No data to plot for ${trace.name}`,
      color: 'yellow',
    });
  }

  const currentPlot = Array.isArray(dataPlot.plot) ? dataPlot.plot : [];

  return {
    ...dataPlot,
    title:
      // If the dataPlot already has a title, append the trace name to it
      dataPlot.title === ''
        ? `${trace.name}`
        : `${dataPlot.title} / ${trace.name}`,
    plot: [...currentPlot, trace],
  };
};

/**
 * @description Handles new plots by fetching data for the provided nodes.
 * @param nodes The nodes to create new plots for.
 * @param updatedActive The updated active configuration.
 * @returns The updated active configuration.
 */
export const handleNewPlot = async (
  nodes: URITreeNodeData[],
  updatedActive: Configuration,
): Promise<Configuration> => {
  //By default we take index [:]
  //: corresponds to all indices (matrix)
  const defaultUri = nodes[0].uri; //Get nodes[0], it's the first node to plot

  const response: PlotDataResponse = await fetchDataPlot(defaultUri);

  if (!checkDimension1(response, updatedActive, nodes)) {
    return updatedActive;
  }

  let xCoordinatesData: Coordinates[] = [];
  let xAxis: Axis = null;

  if (response.data.coordinates.length > 0) {
    //Get index [0] by default xAxis
    //Set the xAxis properties
    xAxis = {
      name: response.data.coordinates[0].name,
      unit: response.data.coordinates[0].unit,
      path: response.data.coordinates[0].path.replace(/\[:\]/g, '[0]'),
    };

    //Get coordinates data for slider - all coordinates except the first one, is considered as x coordinates
    xCoordinatesData = response.data.coordinates
      .slice(1)
      .map((coordinate: PlotCoordinatesResponse) => {
        const dataValue: number[] = getFirstArrayValueFromShape(
          coordinate.value,
          coordinate.shape,
        );

        return {
          name: coordinate.name,
          shape: coordinate.shape,
          data: dataValue,
          index: 0,
          target: coordinate.target.replace(/\[:\]/g, '[0]'),
          nodeUri: defaultUri.replace(/\[:\]/g, '[0]'),
        };
      });
  }

  // Set the yAxis properties
  const yAxis: Axis = {
    name: response.data.name,
    unit: response.data.unit,
  };

  const newGrid = generateNewGridPlot(
    xCoordinatesData,
    xAxis,
    yAxis,
    updatedActive.dataPlot || [],
  );

  const defaultXValue = getFirstArrayValueFromShape(
    response.data.coordinates[0].value,
    response.data.coordinates[0].shape,
  );

  const defaultYValue = getFirstArrayValueFromShape(
    response.data.value,
    response.data.shape,
  );

  const updatedPlot: DataGridPlot = plotData(
    newGrid,
    yAxis.name,
    defaultXValue,
    defaultYValue,
    response.data.value,
    defaultUri.replace(/\[:\]/g, '[0]'),
    response.data.ndim,
    response.data.path.replace(/\[:\]/g, '[0]'),
    response.data.shape,
    nodes[0].name,
    response.data.description,
  );
  updatedActive.dataPlot.push(updatedPlot);
  return updatedActive;
};

/**
 * @description Handles existing plots by checking if the nodes match the plot's nodes.
 * If they do, it updates the plot; otherwise, it fetches new data for the nodes.
 * @param nodes The nodes to update plots for.
 * @param findDataPlot The data plot to find and update.
 * @param updatedActive The updated active configuration.
 * @returns The updated active configuration.
 */
export const handleExistingPlot = async (
  nodes: URITreeNodeData[],
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
    return updateExistingPlot(nodes, findDataPlot, updatedActive);
  }

  for (const node of dataToPlot) {
    const defaultUri = node.uri;
    const response = await fetchDataPlot(defaultUri);

    if (!checkDimension1(response, updatedActive, nodes)) {
      return updatedActive;
    }

    const unit = response.data.unit;
    const unitExists =
      findDataPlot.yAxisData.unit === unit ||
      (findDataPlot.y2AxisData && findDataPlot.y2AxisData.unit === unit);

    const xAxis = findDataPlot.xAxisData;
    const coordsResponse = response.data.coordinates;

    const sliderExist =
      findDataPlot.coordinates &&
      findDataPlot.coordinates.length > 0 &&
      coordsResponse.length > 1;

    const coordinatesExistAndMatch =
      findDataPlot.coordinates.length === coordsResponse.slice(1).length &&
      findDataPlot.coordinates.every((coord, index) => {
        const responseCoord = coordsResponse[index + 1]; // Skip the first coordinate
        return (
          coord.name === responseCoord.name &&
          coord.target === responseCoord.target
        );
      });

    if (sliderExist && !coordinatesExistAndMatch) {
      showNotification({
        title: 'Plot',
        message: 'Coordinates do not match or are missing',
        color: 'yellow',
      });
      updatedActive.checkedNodeURI = nodes.filter((n) => n !== node);
      continue;
    }

    // Check if the xAxisData matches the first coordinate
    if (xAxis && coordsResponse.length > 0) {
      if (
        xAxis.name !== coordsResponse[0].name ||
        xAxis.unit !== coordsResponse[0].unit ||
        xAxis.path !== coordsResponse[0].path
      ) {
        showNotification({
          title: 'Plot',
          message: 'X axis data does not match the first coordinate',
          color: 'yellow',
        });
        updatedActive.checkedNodeURI = nodes.filter((n) => n !== node);
        continue;
      }
    }

    const xAxisMissingOrMismatch =
      (!xAxis && coordsResponse.length > 0) ||
      (xAxis && coordsResponse.length === 0) ||
      (xAxis &&
        coordsResponse.slice(1).length == findDataPlot.coordinates.length &&
        // Check if the xAxisData matches the first coordinate
        (xAxis.name !== coordsResponse[0].name ||
          xAxis.unit !== coordsResponse[0].unit ||
          xAxis.path !== coordsResponse[0].path));

    if (xAxisMissingOrMismatch) {
      showNotification({
        title: 'Plot',
        message: 'X axis data is missing or does not match',
        color: 'yellow',
      });
      updatedActive.checkedNodeURI = nodes.filter((n) => n !== node);
      continue;
    }

    const yAxis: Axis = {
      name: response.data.name,
      unit: unit,
    };

    const defaultXValue = getFirstArrayValueFromShape(
      response.data.coordinates[0].value,
      response.data.coordinates[0].shape,
    );
    //By default we take the first array if index slider changed, improve this to take vector corresponding to the slider index
    const defaultYValue = getFirstArrayValueFromShape(
      response.data.value,
      response.data.shape,
    );

    if (unitExists) {
      const updatedPlot = await plotData(
        findDataPlot,
        yAxis.name,
        defaultXValue,
        defaultYValue,
        response.data.value,
        defaultUri,
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
    } else if (!findDataPlot.y2AxisData) {
      findDataPlot.y2AxisData = {
        name: unit,
        unit: unit,
      };

      const updatedPlot = await plotData(
        findDataPlot,
        yAxis.name,
        defaultXValue,
        defaultYValue,
        response.data.value,
        defaultUri,
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

/**
 * @description Updates existing plot if deselected nodes match the plot's nodes.
 * @param nodes The nodes to update plots for.
 * @param findDataPlot The data plot to find and update.
 * @param updatedActive The updated active configuration.
 * @returns The updated active configuration.
 */
const updateExistingPlot = (
  nodes: URITreeNodeData[],
  findDataPlot: DataGridPlot,
  updatedActive: Configuration,
): Configuration => {
  const plots = findDataPlot?.plot.filter((plot: DataPlotly) =>
    nodes.some(
      (node: URITreeNodeData) =>
        node.uri === normalizeIndices(plot.nodeUri) &&
        node.name === plot.labelUri,
    ),
  );

  /**
   * If all plots have the same y axis with reference(plots[0]), we can set the reference y axis for all plots and remove y2AxisData
   */
  if (plots.every((plot) => plot.yaxis === plots[0].yaxis)) {
    findDataPlot.yAxisData =
      plots[0].yaxis == 'y2' ? findDataPlot.y2AxisData : findDataPlot.yAxisData;
    findDataPlot.y2AxisData = undefined;

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

/**
 * @description Fetches data for each plot in the provided DataGridPlot from file configuration.
 * @param dataGridPlot The array of DataGridPlot objects to fetch data for.
 * @returns A promise that resolves to an array of updated DataGridPlot objects.
 */
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
              const defaultUri = normalizeIndices(plot.nodeUri); // Normalize the URI to ensure it matches the expected format
              const response = await fetchDataPlot(defaultUri);

              if (!response || !response.data) {
                console.warn(`No data returned for nodeUri: ${plot.nodeUri}`);
                errorHasOccurred = true;
                return plot;
              }

              if (dataGrid.coordinates.length > 0) {
                for (const responseCoordinates of response.data.coordinates.slice(
                  1,
                )) {
                  // Check if coordinates already exist in this configuration saved
                  const findCoordinates = dataGrid.coordinates.find((coord) => {
                    return (
                      normalizeIndices(coord.target) ==
                      responseCoordinates.target
                    );
                  });
                  findCoordinates.target = normalizeIndices(
                    findCoordinates.target,
                  );

                  if (findCoordinates) {
                    // If coordinates exist, update the data and shape
                    findCoordinates.data = getFirstArrayValueFromShape(
                      responseCoordinates.value,
                      responseCoordinates.shape,
                    );
                    findCoordinates.name = responseCoordinates.name;
                    findCoordinates.shape = responseCoordinates.shape;
                  }

                  dataGrid.coordinates = dataGrid.coordinates.map((coord) => {
                    // Update the target if it matches the response coordinates
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
                    data: getFirstArrayValueFromShape(
                      responseCoordinates.value,
                      responseCoordinates.shape,
                    ),
                    target: responseCoordinates.target,
                    index: 0,
                  });
                }
              }

              const defaultXValue = getFirstArrayValueFromShape(
                response.data.coordinates[0].value,
                response.data.coordinates[0].shape,
              );
              const defaultYValue = getFirstArrayValueFromShape(
                response.data.value,
                response.data.shape,
              );

              return {
                ...plot,
                name: `${response.data.name}(${response.data.unit})_${plot.labelUri}`,
                description: response.data.description,
                dimensions: response.data.ndim,
                path: response.data.path,
                shape: response.data.shape,
                yData: response.data.value,
                x: defaultXValue.map((x) => x.toString()),
                y: defaultYValue,
              };
            } catch (error) {
              console.error(`Error fetching data for ${plot.nodeUri}:`, error);
              errorHasOccurred = true;
              return plot;
            }
          }),
        );

        const updatedXAxis: Axis = {
          ...dataGrid.xAxisData,
          path: normalizeIndices(dataGrid.xAxisData?.path),
        };

        const dataGridUpdated = {
          ...dataGrid,
          xAxisData: updatedXAxis,
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

/**
 * @description Update the index of a field in a target string.
 * @param target The target string to update.
 * @param fieldName The name of the field to update. ex: "ion" or "profiles_1d"
 * @param index The new index to set.
 * @returns The updated target string.
 */
export function updateIndexFieldName(
  target: string,
  fieldName: string,
  index: number,
): string {
  const regex = new RegExp(`(${fieldName})\\[(\\d+)\\]`);
  const newTarget = target.replace(regex, `${fieldName}[${index}]`);

  return newTarget;
}

/**
 * @description Get the last indexed field from a target string.
 * @param target The target string to search for indexed fields.
 * @returns The name of the last indexed field, or null if none found.
 */
export function getLastIndexedField(target: string): string | null {
  const matches = [...target.matchAll(/([a-zA-Z0-9_]+)\[\d+\]/g)];
  if (matches.length === 0) return null;
  return matches[matches.length - 1][1]; // Last indexed field name is captured
}
