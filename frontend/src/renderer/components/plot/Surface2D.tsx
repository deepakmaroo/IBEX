import Plot from 'react-plotly.js';
import { useEffect, useState } from 'react';
import { Layout } from 'plotly.js';
import { Axis, DataGridPlot } from 'src/renderer/types';
import classe from './SimplePlotly.module.css';
import { Grid } from '@mantine/core';
import { VerticalSlider } from '../verticalSlider';

interface Surface2DProps {
  itemDataGrid: DataGridPlot;
  width?: number;
  height?: number;
}

export const Surface2D = ({ itemDataGrid, width, height }: Surface2DProps) => {
  const [frameIndex, setFrameIndex] = useState(0); //Time slicing by default
  const [layoutPlot, setLayoutPlot] = useState<Partial<Layout>>({});
  const [xAxis, setXAxis] = useState<Axis>(null);
  const [yAxis, setYAxis] = useState<Axis>(null);
  const [zAxis, setZAxis] = useState<Axis>(null);
  const [data3D, setData3D] = useState<number[][][] | null>(null);
  const [slice, setSlice] = useState<number[]>([]);
  const [z, setZ] = useState<number[][]>([]);
  const [x, setX] = useState<number[]>([]);
  const [y, setY] = useState<number[]>([]);

  // Initialize zAxis from itemDataGrid
  useEffect(() => {
    console.log('itemDataGrid', itemDataGrid);
  }, [itemDataGrid]);

  /* Initialize data3D with generated data */
  useEffect(() => {
    console.log('Initializing data3D');
    //Get first plot data
    setData3D(itemDataGrid.plot[0].yData as number[][][]);
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

    // setData3D(generatedData);
  }, [itemDataGrid.plot, itemDataGrid.coordinates]);

  /* Update the layout of the plot */
  useEffect(() => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      title: { text: itemDataGrid.title },
      height: height,
      width: width,
      autosize: true,
      scene: {
        xaxis: { title: { text: xAxis?.name || '' } },
        yaxis: { title: { text: yAxis?.name || '' } },
        zaxis: { title: { text: zAxis?.name || '' } },
      },
      modebar: {
        orientation: 'v',
      },
    }));
  }, [frameIndex, zAxis]);

  useEffect(() => {
    if (data3D) {
      setZ(data3D[frameIndex]); //time
      setX(Array.from({ length: data3D[0][0].length }, (_, i) => i)); // rho
      setY(Array.from({ length: data3D[0].length }, (_, i) => i)); // ion
    }
  }, [data3D, frameIndex]);

  useEffect(() => {
    console.log('z - time', z);
    console.log('x - rho', x);
    console.log('y - ion', y);
  }, [z, x, y]);

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
            data={[
              {
                type: 'surface',
                z: z,
                x: x,
                y: y,
              },
            ]}
            layout={layoutPlot}
            useResizeHandler={false}
            style={{ width: `${width}px`, height: `${height}px` }}
            className={classe.plot2D}
          />
        </Grid.Col>
      </Grid>
    )
  );
};
