import Plot from 'react-plotly.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Layout } from 'plotly.js';
import { Axis, Coordinates, DataGridPlot } from 'src/renderer/types';
import classe from './SimplePlotly.module.css';
import { Grid } from '@mantine/core';
import { VerticalSlider } from '../verticalSlider';
import * as tf from '@tensorflow/tfjs';
import { getFirstArrayValueFromShape } from '../../utils';

interface Surface2DProps {
  itemDataGrid: DataGridPlot;
  width?: number;
  height?: number;
  plotIndex: string;
}

export const Surface2D = ({
  itemDataGrid,
  width,
  height,
  plotIndex,
}: Surface2DProps) => {
  const [frameIndex, setFrameIndex] = useState(0); //Time slicing by default
  const [xAxis, setXAxis] = useState<Axis>(null);
  const [yAxis, setYAxis] = useState<Axis>(null);
  const [zAxis, setZAxis] = useState<Axis>(null);
  const [data3D, setData3D] = useState<number[][][] | null>(null);
  const [slice, setSlice] = useState<number[]>([]);
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
    const tensor = tf.tensor(selectedDataMatrix);
    const coordinatesLength = itemDataGrid.coordinates.length - 1;
    const newAxeOrder = itemDataGrid.coordinates.map((coord, index) => ({
      newPosition: index,
      axeIndex: coordinatesLength - index,
    }));
    const positionToOrigin = JSON.parse(
      JSON.stringify(itemDataGrid.coordinates),
    )
      .reverse()
      .map(
        (reversedCoord: Coordinates) =>
          newAxeOrder.find(
            (axeOrder) => axeOrder.axeIndex === reversedCoord.axeIndex,
          ).newPosition,
      );
    const transposed = tf.transpose(tensor, positionToOrigin);
    const originalDataMatrix = await transposed.array();

    setData3D(originalDataMatrix as number[][][]);

    //For moment we get time for slicing
    const findTimeCoordinate = itemDataGrid.coordinates.find(
      (coordinate) => coordinate.name === 'time',
    );
    if (findTimeCoordinate) {
      setSlice(
        getFirstArrayValueFromShape(
          findTimeCoordinate.data,
          findTimeCoordinate.shape as number[],
        ),
      );
    }

    setZAxis({
      name: itemDataGrid.yAxisData?.name || 'Z Axis',
      unit: itemDataGrid.yAxisData?.unit || '',
    });

    //Initialize xAxis and yAxis
    setXAxis(itemDataGrid.xAxisData);

    for (const coordinate of itemDataGrid.coordinates) {
      if (
        coordinate.name !== itemDataGrid.xAxisData?.name &&
        coordinate.name !== itemDataGrid.yAxisData?.name
      ) {
        setYAxis({
          name: coordinate.name || '',
          unit: coordinate.unit || '',
        });
        break;
      }
    }
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
  }, [frameIndex, zAxis, itemDataGrid, width, height]);

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
      setX(
        getFirstArrayValueFromShape(
          itemDataGrid.coordinates[0].data,
          itemDataGrid.coordinates[0].shape as number[],
        ),
      );
      setY(
        getFirstArrayValueFromShape(
          itemDataGrid.coordinates[1].data,
          itemDataGrid.coordinates[1].shape as number[],
        ),
      );
      setZ(data3D[frameIndex]);
    }
  }, [data3D, frameIndex]);

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
          <VerticalSlider
            name={'time'}
            valueIndex={frameIndex}
            data={slice}
            getValue={(index) => {
              setFrameIndex(index);
            }}
            height={height - 80}
            disabled={!itemDataGrid.isEditing}
          />
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
