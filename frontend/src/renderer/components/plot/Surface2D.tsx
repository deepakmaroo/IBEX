import Plot from 'react-plotly.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Layout } from 'plotly.js';
import { Axis, Coordinates, DataGridPlot } from 'src/renderer/types';
import classe from './SimplePlotly.module.css';
import { Grid, Group } from '@mantine/core';
import { VerticalSlider } from '../verticalSlider';
import {
  compareByAxeIndex,
  getArrayValueFromDependance,
  getFirstArrayValueFromShape,
} from '../../utils';

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
  const [xAxis, setXAxis] = useState<Axis>(null);
  const [yAxis, setYAxis] = useState<Axis>(null);
  const [zAxis, setZAxis] = useState<Axis>(null);
  const [data3D, setData3D] = useState<number[][][] | null>(null);
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

    //Initialize xAxis, yAxis, zAxis
    setZAxis({
      name: itemDataGrid.yAxisData?.name || 'Z Axis',
      unit: itemDataGrid.yAxisData?.unit || '',
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

  return (
    data3D &&
    z.length > 0 &&
    x.length > 0 &&
    y.length > 0 && (
      <Grid
        styles={{
          inner: {
            margin: 0,
            width: 'inherit',
          },
        }}
        mt={10}
      >
        <Grid.Col span="content" mt={10}>
          <Group justify="space-between" gap="0" align="flex-end">
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
                      data={getFirstArrayValueFromShape(
                        item.data,
                        item.shape as number[],
                      )}
                      getValue={(valueIndex) => {
                        handleUpdateCoordinate(item, valueIndex);
                      }}
                      height={height - 80}
                      disabled={!itemDataGrid.isEditing}
                    />
                  ),
              )}
          </Group>
        </Grid.Col>
        <Grid.Col
          span="auto"
          pos="relative"
          w={`${width}px`}
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
            style={{ width: `${width}px`, height: `${height}px` }}
            className={classe.plot2D}
          />
        </Grid.Col>
      </Grid>
    )
  );
};
