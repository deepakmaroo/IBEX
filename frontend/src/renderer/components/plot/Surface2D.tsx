import Plot from 'react-plotly.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Layout } from 'plotly.js';
import { Axis, Coordinates, DataGridPlot } from 'src/renderer/types';
import classe from './SimplePlotly.module.css';
import { Grid } from '@mantine/core';
import { VerticalSlider } from '../verticalSlider';
import * as tf from '@tensorflow/tfjs';

interface Surface2DProps {
  itemDataGrid: DataGridPlot;
  width?: number;
  height?: number;
}

export const Surface2D = ({ itemDataGrid, width, height }: Surface2DProps) => {
  const [frameIndex, setFrameIndex] = useState(0); //Time slicing by default
  const [xAxis, setXAxis] = useState<Axis>(null);
  const [yAxis, setYAxis] = useState<Axis>(null);
  const [zAxis, setZAxis] = useState<Axis>(null);
  const [data3D, setData3D] = useState<number[][][] | null>(null);
  const [slice, setSlice] = useState<number[]>([]);
  const [z, setZ] = useState<number[][]>([]);
  const [x, setX] = useState<number[]>([]);
  const [y, setY] = useState<number[]>([]);
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
    const tensor = tf.tensor(itemDataGrid.plot[0].yData);
    const coordinatesLength = itemDataGrid.coordinates.length - 1;
    const newAxeOrder = itemDataGrid.coordinates.map((coord, index) => ({
      newPosition: index,
      axeIndex: coordinatesLength - index,
    }));
    const positionToOrigin = JSON.parse(JSON.stringify(itemDataGrid.coordinates))
      .reverse()
      .map(
        (reversedCoord: Coordinates) =>
          newAxeOrder.find(
            (axeOrder) => axeOrder.axeIndex === reversedCoord.axeIndex,
          ).newPosition,
      );
    const transposed = tf.transpose(tensor, positionToOrigin);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalDataMatrix: any = await transposed.array();

    setData3D(originalDataMatrix as number[][][]);

    //For moment we get time for slicing
    const findTimeCoordinate = itemDataGrid.coordinates.find(
      (coordinate) => coordinate.name === 'time',
    );
    if (findTimeCoordinate) {
      setSlice(findTimeCoordinate.data);
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
  }, [itemDataGrid.plot, itemDataGrid.coordinates]);

  /* Initialize data3D with generated data */
  useEffect(() => {
    //Get first plot data
    init3DAxis();
  }, [itemDataGrid.plot, itemDataGrid.coordinates]);

  /* Update the layout of the plot */
  useEffect(() => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      title: { text: itemDataGrid.title },
      height: height,
      width: width,
    }));
  }, [frameIndex, zAxis, itemDataGrid, width, height]);

  useEffect(() => {
    if (data3D) {
      setX(Array.from({ length: data3D[0][0].length }, (_, i) => i)); // rho
      setY(Array.from({ length: data3D[0].length }, (_, i) => i)); // ion
      setZ(data3D[frameIndex]); //time
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
                type: 'surface',
                x: x,
                y: y,
                z: z,
              },
            ]}
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
