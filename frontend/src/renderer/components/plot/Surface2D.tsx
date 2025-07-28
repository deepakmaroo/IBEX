import Plot from 'react-plotly.js';
import { useEffect, useState } from 'react';
import { Layout } from 'plotly.js';
import { Axis } from 'src/renderer/types';
import { XAxis } from 'recharts';

// interface SurfacePlotProps {
//   data3D: number[][][]; // [175][8][21]
// }

const generateData3D = (): number[][][] => {
  const frames = 175;
  const rows = 8;
  const cols = 21;
  const data: number[][][] = [];

  for (let t = 0; t < frames; t++) {
    const frame: number[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: number[] = [];
      for (let j = 0; j < cols; j++) {
        // Exemple : une onde simple dépendant de x (j), y (i) et le temps t
        const z = Math.sin((i + j + t / 10) * 0.5);
        row.push(z);
      }
      frame.push(row);
    }
    data.push(frame);
  }

  return data;
};

interface SurfacePlotProps {
  title: string;
  yData: number[][][]; // 3D data for the surface plot
  xAxis: Axis;
  yAxis: Axis;
  zAxis: Axis;
  isStatic: boolean;
}

export const SurfacePlot = ({
  title,
  yData,
  xAxis,
  yAxis,
  zAxis,
  isStatic,
}: SurfacePlotProps) => {
  const [frameIndex, setFrameIndex] = useState(0); //Time slicing by default
  const [layoutPlot, setLayoutPlot] = useState<Partial<Layout>>({});

  useEffect(() => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      title: { text: title },
      autosize: true,
      scene: {
        xaxis: { title: { text: xAxis.name } },
        yaxis: { title: { text: yAxis.name } },
        zaxis: { title: { text: zAxis.name } },
      },
    }));
  }, [frameIndex, title, xAxis, yAxis, zAxis]);

  const data3D = generateData3D();

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
