import Plot from 'react-plotly.js';
import { useState } from 'react';

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

export const SurfacePlot = () => {
  const [frameIndex, setFrameIndex] = useState(0);

  const data3D = generateData3D();

  const z = data3D[frameIndex];
  const x = Array.from({ length: 21 }, (_, i) => i);
  const y = Array.from({ length: 8 }, (_, i) => i);

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
        layout={{
          title: { text: `Frame ${frameIndex}` }, // ✅ title object
          autosize: true,
          scene: {
            xaxis: { title: { text: 'X (21)' } }, // ✅ title object
            yaxis: { title: { text: 'Y (8)' } },  // ✅ title object
            zaxis: { title: { text: 'Valeur' } }, // ✅ title object
          },
        }}
        style={{ width: '100%', height: '500px' }}
      />
    </div>
  );
};
