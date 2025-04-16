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
  description?: string,
  y2Axis?: boolean,
): Promise<DataGridPlot> {
  const trace: DataPlotly = {
    x: xData,
    y: yData,
    name: yName,
    mode: 'lines',
    nodeUri: nodeUri,
    unit: unit,
    description: description,
    path: path,
    dimensions: dimensions,
    yaxis: y2Axis ? 'y2' : '',
  };

  if (y2Axis) {
    dataPlot = {
      ...dataPlot,
      title: `${title}`,
    };
  }

  dataPlot.plot.push(trace);
  console.log('dataPlot', dataPlot);

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
    response.data.ndim,
    response.data.path,
    response.data.description,
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
        response.data.ndim,
        response.data.path,
        response.data.description,
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
        response.data.ndim,
        response.data.path,
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
                name: `${response.data.name}(${response.data.unit})`,
                unit: response.data.unit,
                description: response.data.description,
                dimensions: response.data.ndim,
                path: response.data.path,
                x: response.data.coordinates?.[0]?.value?.map(String) ?? [],
                y: response.data.value?.[0] ?? [],
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

    return []; // Retourne un tableau vide en cas d'erreur critique
  }
}
