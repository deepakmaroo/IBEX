import Plot from 'react-plotly.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Layout } from 'plotly.js';
import { Axis, Coordinates, DataGridPlot } from 'src/renderer/types';
import classe from './SimplePlotly.module.css';
import { Center, Grid, Group, Select, Stack, Text } from '@mantine/core';
import { VerticalSlider } from '../verticalSlider';
import {
  compareByAxeIndex,
  getArrayValueFromDependance,
  isMatrixPlottable,
  swapAxis,
} from '../../utils';
import classes from './Surface2D.module.css';
import { useIbexStore } from '../../stores';

interface Surface2DProps {
  itemDataGrid: DataGridPlot;
  width?: number;
  height?: number;
  plotIndex: string;
  handleUpdateCoordinate: (
    coordinate: Coordinates,
    valueIndex: number,
  ) => Promise<void>;
}

export const Surface2D = ({
  itemDataGrid,
  width,
  height,
  plotIndex,
  handleUpdateCoordinate,
}: Surface2DProps) => {
  const { active, updatedConfiguration } = useIbexStore();
  const coordsUsedInAxes: 1 | 2 = 2;
  const SELECT_AXIS_HEIGHT = 90; // Height of the select axis container
  const [xAxis, setXAxis] = useState<Axis>(null);
  const [yAxis, setYAxis] = useState<Axis>(null);
  const [zAxis, setZAxis] = useState<Axis>(null);
  const [data3D, setData3D] = useState<number[][][] | null>(null);
  const [are3DAxisInit, setAre3DAxisInit] = useState(false);
  const [x, setX] = useState<number[]>([]);
  const [y, setY] = useState<number[]>([]);
  const [z, setZ] = useState<number[][]>([]);
  const plotRef = useRef<Plot | null>(null);
  const [layoutPlot, setLayoutPlot] = useState<Partial<Layout>>({
    autosize: true,
    scene: {
      xaxis: { title: { text: xAxis?.name || '' } },
      yaxis: { title: { text: yAxis?.name || '' } },
      zaxis: { title: { text: zAxis?.name || '' } },
    },
    modebar: {
      orientation: 'v',
    },
  });

  const handleRelayout = (newLayout: Partial<Layout>) => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      ...newLayout, // update the layout with new values
    }));
  };

  const init3DAxis = useCallback(async () => {
    // Transpose data matrix to orign values
    const selectedDataMatrix = itemDataGrid.plot[parseInt(plotIndex)]?.yData;
    if (!selectedDataMatrix) {
      return;
    }
    setData3D(selectedDataMatrix as number[][][]);

    // get colorscale name and unit linked to selected plot
    const colorscaleName =
      itemDataGrid.plot[parseInt(plotIndex)].yaxis === 'y2'
        ? itemDataGrid.y2AxisData?.name || 'Z Axis'
        : itemDataGrid.yAxisData?.name || 'Z Axis';
    const colorscaleUnit =
      itemDataGrid.plot[parseInt(plotIndex)].yaxis === 'y2'
        ? itemDataGrid.y2AxisData?.unit || ''
        : itemDataGrid.yAxisData?.unit || '';

    //Initialize xAxis, yAxis, zAxis
    setZAxis({
      name: colorscaleName,
      unit: colorscaleUnit,
    });

    const xAxisAtHeatmap = {
      name: itemDataGrid.coordinates.find((xCoord) => xCoord.axeIndex === 0)
        .name,
      unit: itemDataGrid.coordinates.find((xCoord) => xCoord.axeIndex === 0)
        .unit,
    };
    setXAxis(xAxisAtHeatmap);

    const yAxisAtHeatmap = {
      name: itemDataGrid.coordinates.find((yCoord) => yCoord.axeIndex === 1)
        .name,
      unit: itemDataGrid.coordinates.find((yCoord) => yCoord.axeIndex === 1)
        .unit,
    };
    setYAxis(yAxisAtHeatmap);
  }, [itemDataGrid.plot, itemDataGrid.coordinates, plotIndex]);

  /* Initialize data3D with generated data */
  useEffect(() => {
    //Get first plot data
    init3DAxis();
  }, [itemDataGrid.plot, itemDataGrid.coordinates, plotIndex]);

  /* Update the layout of the plot */
  useEffect(() => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      title: { text: itemDataGrid.title },
      height: height,
      width: width,
    }));
  }, [itemDataGrid, width, height]);

  /**
   * Update the layout xAxis
   */
  useEffect(() => {
    const XTitle = xAxis?.name
      ? `${xAxis?.name} ${(xAxis?.unit && '[' + xAxis.unit + ']') || ''}`
      : '';
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      xaxis: {
        ...prevLayout.xaxis,
        title: {
          ...prevLayout.xaxis?.title,
          text: XTitle,
        },
      },
    }));
  }, [xAxis]);

  /**
   * Update the layout yAxis
   */
  useEffect(() => {
    const YTitle = yAxis?.name
      ? `${yAxis?.name} ${(yAxis?.unit && '[' + yAxis.unit + ']') || ''}`
      : '';
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      yaxis: {
        ...prevLayout.yaxis,
        title: {
          ...prevLayout.yaxis?.title,
          text: YTitle,
        },
      },
    }));
  }, [yAxis]);

  useEffect(() => {
    if (data3D) {
      // Update x, y & z useStates to plot heatmap
      setX(
        getArrayValueFromDependance(itemDataGrid.coordinates, 0) as number[],
      );
      setY(
        getArrayValueFromDependance(itemDataGrid.coordinates, 1) as number[],
      );
      setZ(
        data3D[
          itemDataGrid.coordinates.find(
            (coord) => coord.axeIndex === itemDataGrid.coordinates.length - 1,
          ).valueIndex
        ],
      ); // Get matrix with correct index
    }
  }, [data3D, itemDataGrid.coordinates]);

  useEffect(() => {
    if (data3D && x && y && z) {
      setAre3DAxisInit(true);
    }
  }, [data3D, x, y, z]);

  return (
    <Grid
      styles={{
        inner: {
          margin: 0,
          width: 'inherit',
        },
      }}
      mt={10}
    >
      <Grid.Col
        className={classes.handlePlotExplorationContainer}
        span="content"
        mt={25}
      >
        <Stack gap={5}>
          {['x', 'y'].map((targetAxis: 'x' | 'y', axisIndex) => (
            <Group key={`handle_axis_${axisIndex}`} gap={5}>
              <Text>{targetAxis}</Text>
              <Select
                label=""
                value={
                  JSON.parse(JSON.stringify(itemDataGrid.coordinates)).find(
                    (coord: Coordinates) =>
                      coord.axeIndex === (targetAxis === 'y' ? 1 : 0),
                  ).name
                }
                data={JSON.parse(JSON.stringify(itemDataGrid.coordinates))
                  .filter((coord: Coordinates) => !coord.isDimensionCoordinate)
                  .map((coord: Coordinates) => coord.name)}
                w={`${width * 0.2}px`}
                onChange={(value) =>
                  value &&
                  swapAxis(
                    itemDataGrid,
                    active,
                    updatedConfiguration,
                    JSON.parse(JSON.stringify(itemDataGrid.coordinates)).find(
                      (coord: Coordinates) => coord.name === value,
                    ).axeIndex,
                    targetAxis,
                  )
                }
                size="xs"
              />
            </Group>
          ))}
        </Stack>

        <Group
          justify="space-between"
          gap="0"
          w={`${width * 0.2}px`}
          miw={`${(itemDataGrid.coordinates.length - coordsUsedInAxes) * 50}px`}
          align="flex-end"
        >
          {JSON.parse(JSON.stringify(itemDataGrid.coordinates))
            .sort(compareByAxeIndex)
            .map(
              (item: Coordinates, valueIndex: number) =>
                item.axeIndex !== 0 &&
                item.axeIndex !== 1 && ( // Don't return slider linked to x & y
                  <VerticalSlider
                    key={`heatmap_slider_${valueIndex}`}
                    name={item.name}
                    valueIndex={item.valueIndex || 0}
                    data={getArrayValueFromDependance(
                      itemDataGrid.coordinates,
                      item.axeIndex,
                    )}
                    getValue={(valueIndex) =>
                      handleUpdateCoordinate(item, valueIndex)
                    }
                    maxWidth={
                      itemDataGrid.coordinates.length &&
                      itemDataGrid.coordinates.length > coordsUsedInAxes
                        ? 100 /
                          (itemDataGrid.coordinates.length - coordsUsedInAxes)
                        : 100
                    }
                    height={height - 80 - SELECT_AXIS_HEIGHT}
                    disabled={!itemDataGrid.isEditing}
                  />
                ),
            )}
        </Group>
      </Grid.Col>
      {are3DAxisInit && [x, y, z].every(isMatrixPlottable) ? (
        <Grid.Col
          span="auto"
          pos="relative"
          w={`${width * 0.8 - 32}px`}
          maw={`${width * 0.8 - 32}px`}
          h={`${height}px`}
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Plot
            ref={plotRef}
            data={[
              {
                type: 'heatmap',
                colorscale: 'Viridis',
                colorbar: {
                  title: {
                    text: zAxis?.name
                      ? `${zAxis?.name} ${(zAxis?.unit && '[' + zAxis.unit + ']') || ''}`
                      : '',
                  },
                },
                x: x,
                y: y,
                z: z,
              },
            ]}
            config={{
              autosizable: false,
              staticPlot: !itemDataGrid.static,
              scrollZoom: true,
              displayModeBar: true,
              showTips: true,
              displaylogo: false,
              modeBarButtonsToRemove: ['lasso2d', 'select2d'],
            }}
            layout={layoutPlot}
            onRelayout={handleRelayout}
            useResizeHandler={false}
            className={classe.plot2D}
            style={{
              maxWidth: `${width * 0.8 - 32}px !important`,
              height: `${height}px`,
            }}
          />
        </Grid.Col>
      ) : (
        <Grid.Col
          span="auto"
          pos="relative"
          w={`${width}px`}
          maw={`${width}px`}
          h={`${height}px`}
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Center h={height}>
            <Text>{are3DAxisInit ? 'Current index has no data' : ''}</Text>
          </Center>
        </Grid.Col>
      )}
    </Grid>
  );
};
