import Plot from 'react-plotly.js';
import { useEffect, useState } from 'react';
import { Layout } from 'plotly.js';
import { Axis, DataGridPlot } from 'src/renderer/types';
import classe from './SimplePlotly.module.css';

interface Surface2DProps {
  itemDataGrid: DataGridPlot;
  width?: number;
  height?: number;
}

export const Surface2D = ({ itemDataGrid, width, height }: Surface2DProps) => {
  const [frameIndex, setFrameIndex] = useState(0); //Time slicing by default
  const [layoutPlot, setLayoutPlot] = useState<Partial<Layout>>({});
  const [zAxis, setZAxis] = useState<Axis>(null);
  const [data3D, setData3D] = useState<number[][][] | null>(null);
  const [z, setZ] = useState<number[][]>([]);
  const [x, setX] = useState<number[]>([]);
  const [y, setY] = useState<number[]>([]);

  /* Initialize data3D with generated data */
  useEffect(() => {
    // const generatedData = generateData3D();
    // console.log('Generated data3D', generatedData);
    console.log('Initializing data3D');
    //Get first plot data
    setData3D(itemDataGrid.plot[0].yData as number[][][]);
    // setData3D(generatedData);
  }, [itemDataGrid.plot]);

  // Initialize zAxis from itemDataGrid
  useEffect(() => {
    console.log('itemDataGrid', itemDataGrid);
    setZAxis({
      name: 'time',
      unit: '-',
    });
  }, [itemDataGrid]);

  /* Update the layout of the plot */
  useEffect(() => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      title: { text: itemDataGrid.title },
      height: height,
      width: width,
      autosize: true,
      scene: {
        xaxis: { title: { text: 'rho' } },
        yaxis: { title: { text: 'ion' } },
        zaxis: { title: { text: 'time' } },
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

  // const z = data3D[frameIndex]; //time
  // const x = Array.from({ length: 21 }, (_, i) => i); //rho
  // const y = Array.from({ length: 8 }, (_, i) => i); //ion

  return (
    data3D &&
    z.length > 0 &&
    x.length > 0 &&
    y.length > 0 && (
      <div>
        <input
          type="range"
          min={0}
          max={data3D.length - 1}
          value={frameIndex}
          onChange={(e) => {
            console.log('Frame index changed:', e.target.value);
            setFrameIndex(Number(e.target.value));
          }}
        />
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
          style={{ width: '100%', height: '500px' }}
          className={classe.plot2D}
          
        />
      </div>
    )
  );
};
