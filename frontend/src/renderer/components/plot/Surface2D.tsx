import Plot from 'react-plotly.js';
import { useEffect, useState } from 'react';
import { Layout } from 'plotly.js';
import { Axis, DataGridPlot } from 'src/renderer/types';
import { use } from 'chai';


// const generateData3D = (): number[][][] => {
//   const frames = 175;
//   const rows = 8;
//   const cols = 21;
//   const data: number[][][] = [];

//   for (let t = 0; t < frames; t++) {
//     const frame: number[][] = [];
//     for (let i = 0; i < rows; i++) {
//       const row: number[] = [];
//       for (let j = 0; j < cols; j++) {
//         // Exemple : une onde simple dépendant de x (j), y (i) et le temps t
//         const z = Math.sin((i + j + t / 10) * 0.5);
//         row.push(z);
//       }
//       frame.push(row);
//     }
//     data.push(frame);
//   }

//   return data;
// };

interface Surface2DProps {
  itemDataGrid: DataGridPlot;
}

export const Surface2D = ({ itemDataGrid }: Surface2DProps) => {
  const [frameIndex, setFrameIndex] = useState(0); //Time slicing by default
  const [layoutPlot, setLayoutPlot] = useState<Partial<Layout>>({});
  const [zAxis, setZAxis] = useState<Axis>(null);
  const [data3D, setData3D] = useState<number[][][] | null>(null);

  useEffect(() => {
    setData3D(itemDataGrid.plot[0].yData as number[][][]);
  }, [itemDataGrid.plot]);

  // Initialize zAxis from itemDataGrid
  useEffect(() => {
    console.log('itemDataGrid', itemDataGrid);
    setZAxis({
      name: 'time',
      unit: '-',
    })
  }, [itemDataGrid]);

  useEffect(() => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      title: { text: itemDataGrid.title },
      autosize: true,
      scene: {
        xaxis: { title: { text: itemDataGrid.xAxisData.name } },
        yaxis: { title: { text: itemDataGrid.yAxisData.name } },
        zaxis: { title: { text: zAxis.name } },
      },
    }));
  }, [frameIndex, zAxis]);


  const z = data3D[frameIndex]; //time
  const x = Array.from({ length: 21 }, (_, i) => i); //rho
  const y = Array.from({ length: 8 }, (_, i) => i); //ion

  return (
    <div>
      <input
        type="range"
        min="0"
        max={data3D.length - 1}
        value={frameIndex}
        onChange={(e) => setFrameIndex(parseInt(e.target.value))}
      />
      <Plot
        useResizeHandler
        data={[
          {
            type: 'surface',
            z: z,
            x: x,
            y: y,
          },
        ]}
        layout={layoutPlot}
        style={{ width: '100%', height: '500px' }}
      />
    </div>
  );
};
