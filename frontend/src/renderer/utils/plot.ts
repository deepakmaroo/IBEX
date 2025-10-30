import { showNotification } from '@mantine/notifications';
import {
  Axis,
  AxisData,
  BaseCoordinates,
  Configuration,
  ConfigurationToSave,
  Coordinates,
  DataGridPlot,
  DataPlotly,
  PlotCoordinatesResponse,
  PlotDataResponse,
  URIData,
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
import {
  getArrayValueFromDependance,
  getFirstArrayValueFromShape,
} from './matrix';
import * as tf from '@tensorflow/tfjs';

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
      // If the title is overwritten we keep it like that
      dataPlot.isTitleOverwritten
        ? dataPlot.title
        : // Else if the dataPlot already has a title, append the trace name to it
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

  const response: PlotDataResponse = await fetchDataPlot(defaultUri);
  defaultUri = getDefaultUri(defaultUri); //Set defaultUri [0] by default

  let coordinatesOfFirstPlot: Coordinates[] = [];
  let xAxis: Axis = null;

  if (response.data.coordinates.length > 0) {
    //Get index [0] by default xAxis
    //Set the xAxis properties
    xAxis = {
      name: response.data.coordinates[0].name,
      unit: response.data.coordinates[0].unit,
      path: getDefaultUri(response.data.coordinates[0].path),
    };

    //Get coordinates data
    coordinatesOfFirstPlot = response.data.coordinates.map(
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
    coordinatesOfFirstPlot,
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
    if (defaultUri !== nodes[0].uri) {
      showNotification({
        title: 'Plot',
        message: 'Unable to plot data from different URIs',
        color: 'yellow',
      });
      updatedActive.checkedNodeURI = nodes.filter((n) => n !== node);
      continue;
    }

    const response = await fetchDataPlot(
      defaultUri,
      findDataPlot.downsampled_method,
    );

    defaultUri = getDefaultUri(defaultUri); //Set defaultUri [0] by default

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
          const responseCoord = coordsResponse[index];
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
  findDataPlot.title = findDataPlot.isTitleOverwritten
    ? findDataPlot.title
    : plots.map((plot) => plot.name).join('/');
  updatedActive.dataPlot = [
    ...updatedActive.dataPlot.filter((plot) => plot.i !== findDataPlot.i),
    findDataPlot,
  ];
  return updatedActive;
};

/**
 * @description Format config to allow to call plotNodeUriLoaded
 * @param activeConfiguration The configuration to format
 */
export function formatConfigBeforeLoadingURIs(
  activeConfiguration: ConfigurationToSave | Configuration,
) {
  const newListDataGridPlot: DataGridPlot[] = activeConfiguration.dataPlot.map(
    (data): DataGridPlot => ({
      ...data,
      isEditing: false,
      static: false,
      coordinates:
        data.coordinates && data.coordinates.length > 0
          ? data.coordinates.map(
              (coord: BaseCoordinates, index): Coordinates => {
                return {
                  ...coord,
                  name: '',
                  shape: [],
                  downsampled_shape: [],
                  coordinates: [],
                  data: [],
                  axeIndex: index,
                };
              },
            )
          : [],
      plot: data.plot.map((plot): DataPlotly => {
        const matched = activeConfiguration.dataURI.find(
          (uri: URIData) => plot.labelUri === uri.name,
        );

        let fullNodeUri = plot.nodeUri;
        if (matched) {
          const suffix = plot.nodeUri.slice(matched.name.length);
          fullNodeUri = `${matched.uri}${suffix}`;
        }

        return {
          ...plot,
          nodeUri: fullNodeUri,
          yData: [],
          x: [],
          y: [],
        };
      }),
    }),
  );

  return newListDataGridPlot;
}

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

        const updatedPlot: DataPlotly[] = [];
        for (const plot of dataGrid.plot) {
          if (!plot.nodeUri) {
            updatedPlot.push(plot);
            continue;
          }

          try {
            const defaultUri = normalizeIndices(plot.nodeUri); // Normalize the URI to ensure it matches the expected format

            if (
              defaultUri.split('#')[0] !==
              dataGrid.plot[0].nodeUri.split('#')[0]
            ) {
              showNotification({
                title: 'Plot',
                message: 'Unable to plot data from different URIs',
                color: 'yellow',
              });
              continue;
            }

            const response = await fetchDataPlot(defaultUri);

            if (!response || !response.data) {
              console.warn(`No data returned for nodeUri: ${plot.nodeUri}`);
              errorHasOccurred = true;
              updatedPlot.push(plot);
              continue;
            }

            let yResponsePath = response.data.path;

            const plotIndex = dataGrid.plot.findIndex(
              (plotFromList) => plotFromList.nodeUri === plot.nodeUri,
            );
            const matchingCoordList: Coordinates[] = [];
            for (const responseCoordinates of response.data.coordinates) {
              const matchingCoord: Coordinates = JSON.parse(
                JSON.stringify(dataGrid.coordinates),
              ).find(
                (c: Coordinates) =>
                  normalizeIndices(c.path) === responseCoordinates.path,
              );
              const lastField = getLastIndexedField(responseCoordinates.target);
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

              matchingCoordList.push(matchingCoord);
            }

            if (plotIndex === 0) {
              // Update datagrid coordinates with first plot response
              dataGrid.coordinates = matchingCoordList;
            }

            if (response.data.downsampled_method) {
              dataGrid.downsampled_method = response.data.downsampled_method;
            }

            let defaultXValue: number[] | string[] = [];
            if (response.data.coordinates.length > 0) {
              // Get x vector for each plot
              defaultXValue = getArrayValueFromDependance(matchingCoordList, 0);
            }
            const defaultYValue = getVectorData(
              dataGrid.coordinates,
              response.data.value,
            );

            const plotToPush = {
              ...plot,
              name: `${response.data.name}_${plot.labelUri}`,
              description: response.data.description,
              dimensions: response.data.ndim,
              path: yResponsePath,
              shape: response.data.shape as number[],
              yData: response.data.value,
              x: defaultXValue,
              y: defaultYValue,
              mode: defaultYValue.length > 1 ? 'lines' : 'lines+markers',
            } as DataPlotly;
            updatedPlot.push(plotToPush);
          } catch (error) {
            console.error(`Error fetching data for ${plot.nodeUri}:`, error);
            errorHasOccurred = true;
            updatedPlot.push(plot);
          }
        }

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
    .filter((coord: Coordinates) => coord.axeIndex !== 0)
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

/**
 * @description
 * Checks whether a one-dimensional or two-dimensional array containing strings or numbers
 * has at least one valid (non-empty, non-null, non-NaN) value.
 * @param arr The input array to check. Can be either a 1D or 2D array of strings or numbers.
 * @returns `true` if at least one value is valid (not NaN, null, undefined, or an empty string), otherwise `false`.
 * @example
 * hasAtLeastOneValidValue([NaN, NaN, NaN]); // false
 * hasAtLeastOneValidValue(['', ' ', NaN]);  // false
 * hasAtLeastOneValidValue(['ok', NaN]);     // true
 * hasAtLeastOneValidValue([[NaN, ''], ['hello', NaN]]); // true
 */
export function hasAtLeastOneValidValue(
  arr: (string | number)[] | (string | number)[][],
): boolean {
  if (Array.isArray(arr[0])) {
    // 2D table
    return (arr as (string | number)[][]).some(
      (subArr) => hasAtLeastOneValidValue(subArr), // appel récursif
    );
  }

  // Else, 1D table
  return (arr as (string | number)[]).some((v) => {
    if (v === null || v === undefined) return false;
    if (typeof v === 'number') return !Number.isNaN(v);
    if (typeof v === 'string') return v.trim() !== '';
    return false;
  });
}

/**
 * @description
 * Checks whether a matrix-like input (1D or 2D array of strings/numbers) is plottable
 * This function is designed to work well with array methods such as `.every()`
 * to validate multiple inputs (e.g., `[x, y, z].every(isMatrixPlottable)`).
 * @param value The matrix-like input to check.
 * @returns `true` if the matrix is plottable, otherwise `false`.
 * @example
 * isMatrixPlottable([[1, 2], [3, 4]]); // true
 * isMatrixPlottable([NaN, NaN]);       // false
 * isMatrixPlottable(undefined);        // false
 */
export function isMatrixPlottable(
  value: (string | number)[] | (string | number)[][],
): boolean {
  if (value === undefined) return false;

  try {
    const tensor = tf.tensor(value);
    const shape = tensor.shape;
    const lastDim = shape[shape.length - 1];

    // Check if matrix is not empty & get at least one valide value
    return lastDim !== 0 && hasAtLeastOneValidValue(value);
  } catch {
    // If tensor fails (irregular shape, etc.)
    return false;
  }
}

/**
 * Replace recursively all `null` or `undefined` by `NaN`.
 * Works for AxisData of dimension 1D, 2D or 3D.
 *
 * @param arr - Array which could contain nulls or undefined
 * @returns New array with NaN instead of null/undefined
 */
function replaceNullsWithNaN(arr: AxisData): AxisData {
  if (Array.isArray(arr)) {
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    return arr.map((v: any) => {
      return Array.isArray(v) ? replaceNullsWithNaN(v as AxisData) : (v ?? NaN);
    }) as AxisData;
  }

  // 1D Case
  return arr ?? NaN;
}

export const swapAxis = async (
  itemDataGrid: DataGridPlot,
  active: Configuration,
  updatedConfiguration: (configuration: Configuration) => void,
  axeIndexToSwap: number,
  targetAxis: 'x' | 'y',
) => {
  const axeIndexOfTargetAxis = targetAxis === 'y' ? 1 : 0;
  // Get indexes to swap
  const actualTargetAxisIndex: number = itemDataGrid.coordinates.findIndex(
    (coordinate) => coordinate.axeIndex === axeIndexOfTargetAxis,
  );
  const itemToSwitchIndex: number = itemDataGrid.coordinates.findIndex(
    (coordinate) => coordinate.axeIndex === axeIndexToSwap,
  );

  const updatedDataPlotList: DataGridPlot[] = JSON.parse(
    JSON.stringify(active.dataPlot),
  );
  const updatedDataPlot = updatedDataPlotList.find(
    (dataPlotToUpdate) => dataPlotToUpdate.i === itemDataGrid.i,
  );

  // Swap axis
  updatedDataPlot.coordinates[actualTargetAxisIndex].axeIndex = axeIndexToSwap;
  updatedDataPlot.coordinates[itemToSwitchIndex].axeIndex =
    axeIndexOfTargetAxis;

  // Reset indexValue
  updatedDataPlot.coordinates[actualTargetAxisIndex].valueIndex = 0;
  updatedDataPlot.coordinates[itemToSwitchIndex].valueIndex = 0;

  // Update all coordinates targets & paths impacted with resetted indexValue
  const actualXAxisTargetLastName = getLastIndexedField(
    updatedDataPlot.coordinates[actualTargetAxisIndex].target,
  );
  const itemToSwitchTargetLastName = getLastIndexedField(
    updatedDataPlot.coordinates[itemToSwitchIndex].target,
  );
  const actualXAxisupdatedPath = updateIndexFieldName(
    updatedDataPlot.coordinates[actualTargetAxisIndex].target || '',
    actualXAxisTargetLastName,
    0,
  );
  updateIndexFieldName(actualXAxisupdatedPath, itemToSwitchTargetLastName, 0);
  const itemToSwitchupdatedPath = updateIndexFieldName(
    updatedDataPlot.coordinates[itemToSwitchIndex].target || '',
    itemToSwitchTargetLastName,
    0,
  );
  updateIndexFieldName(itemToSwitchupdatedPath, actualXAxisTargetLastName, 0);

  // Modify targets from each coordinates
  for (const coordinate of updatedDataPlot.coordinates) {
    coordinate.target = updateIndexFieldName(
      coordinate.target || '',
      itemToSwitchTargetLastName,
      0,
    );
    coordinate.target = updateIndexFieldName(
      coordinate.target,
      actualXAxisTargetLastName,
      0,
    );

    coordinate.path = updateIndexFieldName(
      coordinate.path || '',
      itemToSwitchTargetLastName,
      0,
    );
    coordinate.path = updateIndexFieldName(
      coordinate.path,
      actualXAxisTargetLastName,
      0,
    );
  }

  // Set new xAxis plot
  const xIndex: number = updatedDataPlot.coordinates.findIndex(
    (coordinate) => coordinate.axeIndex === 0,
  );
  updatedDataPlot.xAxisData.name = updatedDataPlot.coordinates[xIndex].name;
  updatedDataPlot.xAxisData.path = updatedDataPlot.coordinates[xIndex].path;
  updatedDataPlot.xAxisData.unit = updatedDataPlot.coordinates[xIndex].unit;

  // Transpose yData with resetted valueIndex
  await transposeAxis(updatedDataPlot, axeIndexToSwap, targetAxis);

  // Update x & y with translated dataY
  for (const plot of updatedDataPlot.plot) {
    const vectorData = getVectorData(updatedDataPlot.coordinates, plot.yData);
    plot.y = vectorData;
    // Get x values switch x dependances
    plot.x = getArrayValueFromDependance(updatedDataPlot.coordinates, 0);
  }

  // Limit coordinate sliders to the max of their new shape
  limitSlidersToMaxLength(updatedDataPlot.coordinates);

  const updatedActive = {
    ...active,
    dataPlot: updatedDataPlotList,
  };
  updatedConfiguration(updatedActive);
};

/**
 * Update coordinates to limit sliders to maximum length.
 * @param coordinates The coordinates to check and update if necessary.
 */
export function limitSlidersToMaxLength(coordinates: Coordinates[]) {
  for (const coord of coordinates) {
    const coordLength = getArrayValueFromDependance(
      coordinates,
      coord.axeIndex,
    )?.length;
    if (coordLength && coord.valueIndex > coordLength - 1) {
      coord.valueIndex = coordLength - 1;
    }
  }
}

/**
 * Find the maximum shape of a potentially irregular array.
 */
function getMaxShape(arr: any[]): number[] {
  if (!Array.isArray(arr)) return [];
  const lengths = arr.map((sub) =>
    Array.isArray(sub) ? getMaxShape(sub) : [],
  );
  const maxInner = lengths.reduce<number[]>(
    (acc, curr) => curr.map((v, i) => Math.max(acc[i] || 0, v)),
    [],
  );
  return [arr.length, ...maxInner];
}

/**
 * Recursively fills an irregular array with NaN
 * to match a given shape.
 */
function reshapeMatrix(arr: any[], shape: number[], depth = 0): any[] {
  const size = shape[depth];
  const result = [...arr];

  for (let i = 0; i < size; i++) {
    if (result[i] === undefined) {
      // If an element is missing, either NaN or a subarray filled with NaN is inserted
      if (shape.length > depth + 1) {
        result[i] = reshapeMatrix([], shape, depth + 1);
      } else {
        result[i] = NaN;
      }
    } else if (Array.isArray(result[i])) {
      result[i] = reshapeMatrix(result[i], shape, depth + 1);
    }
  }

  return result;
}

/**
 * Recursively removes NaNs added by reshapeMatrix.
 * - Removes NaN values from arrays.
 * - Deletes empty sub-tables after cleaning.
 */
function removeNaNPadding(arr: any): any {
  if (!Array.isArray(arr)) {
    return Number.isNaN(arr) ? undefined : arr;
  }

  // Clean recursively
  const cleaned = arr
    .map(removeNaNPadding)
    .filter((v) => v !== undefined && !(Array.isArray(v) && v.length === 0));

  return cleaned;
}

async function transposeAxis(
  updatedDataPlot: DataGridPlot,
  axeIndexToSwap: number,
  targetAxis: 'x' | 'y',
) {
  const axeIndexOfTargetAxis = targetAxis === 'y' ? 1 : 0;
  // Modify each plot in graph
  for (const plotToTranspose of updatedDataPlot.plot) {
    // DETERMINE WHICH AXIS TO TRANSPOSE
    // Initial position
    const newPositions: number[] = JSON.parse(
      JSON.stringify(updatedDataPlot.coordinates),
    )
      .map((coord: Coordinates) => coord.axeIndex)
      .sort()
      .reverse(); // Reverse to get axeIndex order
    // SWAP axeIndexOfTargetAxis with axeIndexToSwap
    const tempSwap = newPositions[axeIndexOfTargetAxis];
    newPositions[axeIndexOfTargetAxis] = newPositions[axeIndexToSwap];
    newPositions[axeIndexToSwap] = tempSwap;
    // Reverse for getting position => [0, 1, 3, 2]
    newPositions.reverse();

    // RESHAPE IRREGULAR MATRIX OF NaN TO ALLOW TO TRANSPOSE
    const matrixWithNaN = replaceNullsWithNaN(plotToTranspose.yData); // Replace nulls by NaN to keep NaN instead of zeros after transposition
    // Find maximal shape
    const shape = getMaxShape(matrixWithNaN);
    // Fill with NaN
    const reshapedMatrix = reshapeMatrix(matrixWithNaN, shape);

    // Transpose dataY
    const tensor = tf.tensor(reshapedMatrix);
    const dataTransposed = tensor.transpose(newPositions);
    const newMatrix = (await dataTransposed.array()) as AxisData;

    // Restored irregular shape (suppress all NaN)
    const restoredMatrix = removeNaNPadding(newMatrix);

    // Update yData & shape
    plotToTranspose.yData = restoredMatrix;
  }
}
