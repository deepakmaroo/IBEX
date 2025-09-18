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
import {
  getDefaultUri,
  getLastIndexedField,
  normalizeIndices,
  updateIndexFieldName,
} from './uri';
import { getFirstArrayValueFromShape } from './matrix';

/**
 * @description Checks if the response data has more than one dimension.
 * If it does, it shows a notification and updates the active configuration to remove the first node.
 * @param response The PlotDataResponse to check.
 * @param updatedActive The updated active configuration.
 * @param nodes The nodes to update.
 * @returns A boolean indicating whether the dimension check passed.
 */
export const checkDimension1 = async (
  response: PlotDataResponse,
  updatedActive: Configuration,
  nodes: URITreeNodeData[],
): Promise<PlotDataResponse> | undefined => {
  if (!response || response.data.ndim > 1) {
    // Get new uri to have homogeneous shape
    const defaultUri = nodes[0].uri; //Use normalized URI to get all matrix
    let newUri: string;
    let coordinateNameDimension: string;
    for (const coordinate of response.data.coordinates) {
      if (coordinate.shape !== 'irregular') {
        newUri = defaultUri.replace(
          `${coordinate.name}[:]`,
          `${coordinate.name}[0]`,
        );
        coordinateNameDimension = coordinate.name;
        break;
      }
    }
    if (newUri) {
      const homogenousResponse: PlotDataResponse = await fetchDataPlot(newUri);
      if (homogenousResponse.data.shape !== 'irregular') {
        // Add information indicating that this coordinate is used to select the dimension
        homogenousResponse.data.coordinates.find(
          (coord) => coord.name === coordinateNameDimension,
        ).isDimensionCoordinate = true;
        return homogenousResponse;
      }
    }

    showNotification({
      title: 'Plot',
      message: 'Cannot plot data with more than one dimension',
      color: 'yellow',
    });
    updatedActive.checkedNodeURI = nodes.filter((n) => n !== nodes[0]);
    return undefined;
  }
  return response;
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
  downsampled_method: string,
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
    downsampled_method: downsampled_method,
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
  //* By default we take index [:]
  //* : corresponds to all indices (matrix)
  let defaultUri = nodes[0].uri; //Use normalized URI to get all matrix

  let response: PlotDataResponse = await fetchDataPlot(defaultUri);
  defaultUri = getDefaultUri(defaultUri); //Set defaultUri [0] by default

  const checkedDimensionResponse = await checkDimension1(
    response,
    updatedActive,
    nodes,
  );
  if (!checkedDimensionResponse) {
    return updatedActive;
  } else {
    response = checkedDimensionResponse;
  }

  let xCoordinatesData: Coordinates[] = [];
  let xAxis: Axis = null;

  if (response.data.coordinates.length > 0) {
    //Get index [0] by default xAxis
    //Set the xAxis properties
    xAxis = {
      name: response.data.coordinates[0].name,
      unit: response.data.coordinates[0].unit,
      path: getDefaultUri(response.data.coordinates[0].path),
    };

    //Get coordinates data for slider - all coordinates except the first one, is considered as x coordinates
    xCoordinatesData = response.data.coordinates.map(
      (coordinate: PlotCoordinatesResponse, index) => {
        const dataValueMatrix: AxisData = coordinate.value;

        return {
          name: coordinate.name,
          shape: coordinate.shape,
          downsampled_shape: coordinate.downsampled_shape,
          coordinates: coordinate.coordinates,
          data: dataValueMatrix,
          valueIndex: 0,
          path: getDefaultUri(coordinate.path),
          target: getDefaultUri(coordinate.target),
          nodeUri: defaultUri,
          axeIndex: index,
          unit: coordinate.unit || '',
          isDimensionCoordinate: coordinate?.isDimensionCoordinate,
        };
      },
    );
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

  let defaultXValue: number[] = [];
  if (response.data.coordinates.length > 0) {
    defaultXValue = getFirstArrayValueFromShape(
      response.data.coordinates[0].value,
      response.data.coordinates[0].shape as number[],
    );
  }

  const defaultYValue = getFirstArrayValueFromShape(
    response.data.value,
    response.data.shape as number[],
  );

  const updatedPlot: DataGridPlot = plotData(
    newGrid,
    yAxis.name,
    defaultXValue,
    defaultYValue,
    response.data.value,
    defaultUri,
    response.data.ndim,
    getDefaultUri(response.data.path),
    response.data.shape as number[],
    nodes[0].name,
    response.data.downsampled_method,
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
        (plot) =>
          normalizeIndices(plot.nodeUri) === node.uri &&
          plot.labelUri === node.name,
      ),
  );

  if (dataToPlot.length === 0) {
    return updateExistingPlot(nodes, findDataPlot, updatedActive);
  }

  for (const node of dataToPlot) {
    let defaultUri = node.uri;

    let response = await fetchDataPlot(
      defaultUri,
      findDataPlot.downsampled_method,
    );

    defaultUri = getDefaultUri(defaultUri); //Set defaultUri [0] by default

    const checkedDimensionResponse = await checkDimension1(
      response,
      updatedActive,
      nodes,
    );
    if (!checkedDimensionResponse) {
      return updatedActive;
    } else {
      response = checkedDimensionResponse;
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

    let xAxisResponsePath = '';
    if (response.data.coordinates.length > 0) {
      xAxisResponsePath = getDefaultUri(coordsResponse[0].path);
    }
    let yDataResponsePath = getDefaultUri(response.data.path);

    if (sliderExist) {
      /**
       * If slider exists, we need to update the index of the response coordinates
       * to match the coordinates in the findDataPlot.
       */
      const coordResponses = coordsResponse.slice(1);

      coordResponses.forEach((coordRes) => {
        const matchingCoord = findDataPlot.coordinates.find(
          (c) => c.name === coordRes.name,
        );

        if (!matchingCoord) return;

        const lastField = getLastIndexedField(coordRes.target);

        if (!lastField) return;

        coordsResponse.forEach((res) => {
          res.target = updateIndexFieldName(
            res.target,
            lastField,
            matchingCoord.valueIndex,
          );
        });

        //* Update the defaultUri, xAxisResponsePath, and yDataResponsePath to match the index
        defaultUri = updateIndexFieldName(
          defaultUri,
          lastField,
          matchingCoord.valueIndex,
        );
        xAxisResponsePath = updateIndexFieldName(
          xAxisResponsePath,
          lastField,
          matchingCoord.valueIndex,
        );
        yDataResponsePath = updateIndexFieldName(
          yDataResponsePath,
          lastField,
          matchingCoord.valueIndex,
        );
      });
    }

    const coordinatesExistAndMatch =
      findDataPlot.coordinates.length === coordsResponse.length &&
      JSON.parse(JSON.stringify(findDataPlot.coordinates))
        .sort(compareByAxeIndex)
        .every((coord: Coordinates, index: number) => {
          const responseCoord = coordsResponse[index]; // Skip the first coordinate
          return coord.name === responseCoord.name;
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
        xAxis.path !== xAxisResponsePath
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
          xAxis.path !== xAxisResponsePath));

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

    let defaultXValue: number[] = [];
    if (response.data.coordinates.length > 0) {
      defaultXValue = getFirstArrayValueFromShape(
        response.data.coordinates[0].value,
        response.data.coordinates[0].shape as number[],
      );
    }

    const defaultYValue = getVectorData(
      findDataPlot.coordinates,
      response.data.value,
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
        yDataResponsePath,
        response.data.shape as number[],
        node.name,
        response.data.downsampled_method,
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
        name: response.data.name,
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
        yDataResponsePath,
        response.data.shape as number[],
        node.name,
        response.data.downsampled_method,
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
        const updatedXAxisData: Axis = dataGrid.xAxisData;

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

              let yResponsePath = response.data.path;

              let index = 0;
              for (const responseCoordinates of response.data.coordinates) {
                index++;
                const matchingCoord = dataGrid.coordinates.find(
                  (c) =>
                    normalizeIndices(c.target) === responseCoordinates.target,
                );

                if (!matchingCoord) {
                  dataGrid.coordinates.push({
                    name: responseCoordinates.name,
                    shape: responseCoordinates.shape,
                    downsampled_shape: responseCoordinates.downsampled_shape,
                    coordinates: responseCoordinates.coordinates,
                    data: responseCoordinates.value,
                    path: getDefaultUri(responseCoordinates.path),
                    target: getDefaultUri(responseCoordinates.target),
                    unit: responseCoordinates.unit || '',
                    valueIndex: 0,
                    axeIndex: index,
                  });
                }

                const lastField = getLastIndexedField(
                  responseCoordinates.target,
                );
                if (!lastField) continue;

                // If coordinates exist, update the data and shape
                matchingCoord.data = responseCoordinates.value;
                matchingCoord.name = responseCoordinates.name;
                matchingCoord.path = getDefaultUri(responseCoordinates.path);
                matchingCoord.unit = responseCoordinates.unit || '';
                matchingCoord.shape = responseCoordinates.shape;
                matchingCoord.downsampled_shape =
                  responseCoordinates.downsampled_shape;
                matchingCoord.coordinates = responseCoordinates.coordinates;

                //* Update the target - yPath - axis data with the index
                matchingCoord.target = updateIndexFieldName(
                  matchingCoord.target,
                  lastField,
                  matchingCoord.valueIndex,
                );

                yResponsePath = updateIndexFieldName(
                  yResponsePath,
                  lastField,
                  matchingCoord.valueIndex,
                );

                updatedXAxisData.path = updateIndexFieldName(
                  updatedXAxisData.path,
                  lastField,
                  matchingCoord.valueIndex,
                );

                //Upgrade datagrid coordinates with the response
                dataGrid.coordinates = dataGrid.coordinates.map((coord) => {
                  // Update the target if it matches the response coordinates
                  if (coord.name === matchingCoord.name) {
                    return matchingCoord;
                  }
                  return coord;
                });
              }

              if (response.data.downsampled_method) {
                dataGrid.downsampled_method = response.data.downsampled_method;
              }

              let defaultXValue: number[] = [];
              if (response.data.coordinates.length > 0) {
                defaultXValue = getFirstArrayValueFromShape(
                  response.data.coordinates[0].value,
                  response.data.coordinates[0].shape as number[],
                );
              }
              const defaultYValue = getFirstArrayValueFromShape(
                response.data.value,
                response.data.shape as number[],
              );

              return {
                ...plot,
                name: `${response.data.name}_${plot.labelUri}`,
                description: response.data.description,
                dimensions: response.data.ndim,
                path: yResponsePath,
                shape: response.data.shape as number[],
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

        const dataGridUpdated = {
          ...dataGrid,
          xAxisData: updatedXAxisData,
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
 * @description Retrieves vector data from a plot item based on the provided URI and coordinates.
 * @param uri The URI to retrieve the vector data from.
 * @param coordinates The coordinates to use for retrieving the vector data.
 * @param plotItem The plot item containing the yData to extract the vector from.
 * @returns The vector data as an array of numbers, or undefined if the indices are invalid
 */
export function getVectorData(coordinates: Coordinates[], yData: AxisData) {
  const coordinatesLength: number = coordinates.length;

  // Extract only matrix indexes without taking care of dimension coordinate
  const matrixIndexes = JSON.parse(JSON.stringify(coordinates))
    .sort(compareByAxeIndex)
    .reverse()
    .filter(
      (coord: Coordinates) =>
        coord.axeIndex !== 0 && !coord.isDimensionCoordinate,
    )
    .map((coord: Coordinates) => coord.valueIndex);

  // Retrieve vector to plot
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  let result: any = yData;
  let shapeIndex = 0;
  for (const index of matrixIndexes) {
    if (shapeIndex < coordinatesLength && index < result.length) {
      result = result[index];
      shapeIndex++;
    } else {
      if (!(shapeIndex < coordinatesLength)) {
        break;
      } else {
        console.warn('Impossible to plot: invalid index or incorrect length');
        return undefined;
      }
    }
  }
  const vectorData: number[] = result;
  return vectorData;
}

/**
 * @description Compares two Coordinates objects by their axeIndex.
 * @param a The first Coordinates object.
 * @param b The second Coordinates object.
 * @returns A negative number if a's axeIndex is less than b's, a positive number if greater, or 0 if equal.
 */
export function compareByAxeIndex(a: Coordinates, b: Coordinates) {
  if (a.axeIndex < b.axeIndex) {
    return -1;
  } else if (a.axeIndex > b.axeIndex) {
    return 1;
  }
  return 0;
}
