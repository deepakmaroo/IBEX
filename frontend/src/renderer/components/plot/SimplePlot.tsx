import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts';
import { useEffect, useState, useRef } from 'react';
import { ActionIcon, Container, Group, Title } from '@mantine/core';
import { IconCamera } from '@tabler/icons-react';
import { toPng } from 'html-to-image';
import { useHover } from '@mantine/hooks';
import { DataPlot } from 'src/renderer/types';

interface SimplePlotProps {
  data: DataPlot[];
  titleForm: string;
  xAxisName: string;
  yAxisName: string;
  width?: number;
  height?: number;
}

const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export const SimplePlot = ({
  data,
  titleForm,
  xAxisName,
  yAxisName,
  height,
  width,
}: SimplePlotProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { hovered, ref } = useHover();

  const transformedData = data.flatMap((node) =>
    node.valueY.map((y, i) => ({
      nameNode: node.nameNode,
      x: node.valueX[i],
      y,
    })),
  );

  const uniqueNodes = Array.from(
    new Set(transformedData.map((item) => item.nameNode)),
  );
  const [nodeColors, setNodeColors] = useState<Record<string, string>>({});
  const [refAreaLeft, setRefAreaLeft] = useState<number | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<number | null>(null);
  const [zoomedData, setZoomedData] = useState(transformedData);
  const [xDomain, setXDomain] = useState<[number, number]>([
    transformedData[0]?.x || 0,
    transformedData[transformedData.length - 1]?.x || 1,
  ]);

  // Generate colors only once for each unique node
  useEffect(() => {
    const colors: Record<string, string> = {};
    uniqueNodes.forEach((node) => {
      if (!nodeColors[node]) {
        colors[node] = getRandomColor();
      }
    });
    if (colors.length) {
      setNodeColors((prevColors) => ({ ...prevColors, ...colors }));
    }
  }, [uniqueNodes, nodeColors]);

  const customTooltip = ({ payload }: any) => {
    if (payload && payload.length > 0) {
      const { nameNode, x, y } = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: '#fff',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        >
          <p>
            <strong>{nameNode}</strong>
          </p>
          <p>
            <strong>{xAxisName} :</strong> {x}
          </p>
          <p>
            <strong>{yAxisName} :</strong> {y}
          </p>
        </div>
      );
    }
    return null;
  };

  const handleZoom = () => {
    if (
      refAreaLeft === null ||
      refAreaRight === null ||
      refAreaLeft === refAreaRight
    ) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }

    const [minX, maxX] = [
      Math.min(refAreaLeft, refAreaRight),
      Math.max(refAreaLeft, refAreaRight),
    ];
    const filteredData = transformedData.filter(
      (d) => d.x >= minX && d.x <= maxX,
    );
    setZoomedData(filteredData);
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const handleWheelZoom = (event: React.WheelEvent) => {
    // event.preventDefault();

    const zoomFactor = 0.1;
    const [minX, maxX] = xDomain;
    const range = maxX - minX;

    if (range <= 0) return; // Empêche un domaine invalide

    const center = minX + range / 2;
    let newMinX, newMaxX;

    if (event.deltaY < 0) {
      // Zoom avant (réduction de l'intervalle)
      newMinX = center - (range * (1 - zoomFactor)) / 2;
      newMaxX = center + (range * (1 - zoomFactor)) / 2;
    } else {
      // Zoom arrière (agrandissement de l'intervalle)
      newMinX = center - (range * (1 + zoomFactor)) / 2;
      newMaxX = center + (range * (1 + zoomFactor)) / 2;
    }

    // Empêcher le dépassement des bornes de l'axe X
    const minDataX = transformedData[0]?.x || 0;
    const maxDataX = transformedData[transformedData.length - 1]?.x || 1;

    if (newMinX < minDataX) newMinX = minDataX;
    if (newMaxX > maxDataX) newMaxX = maxDataX;
    if (newMinX === newMaxX) return; // Empêche un domaine illégal

    setXDomain([newMinX, newMaxX]);
  };
  const resetZoom = () => {
    setZoomedData(transformedData);
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  const exportToPNG = () => {
    if (chartRef.current === null) {
      return;
    }

    toPng(chartRef.current, { cacheBust: true })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${titleForm}.png`;
        link.click();
      })
      .catch((err) => {
        console.error('Failed to export chart as image', err);
      });
  };

  return (
    <Container
      pos="relative"
      ref={ref as React.LegacyRef<HTMLDivElement>}
      pt="2rem"
    >
      <ActionIcon
        variant="filled"
        aria-label="screen-plot"
        pos="absolute"
        size="lg"
        right={5}
        top={'2rem'}
        onClick={exportToPNG}
      >
        <IconCamera style={{ width: '70%', height: '70%' }} stroke={1.5} />
      </ActionIcon>
      <Group justify="center">
        <Title>{titleForm}</Title>
      </Group>
      <button onClick={resetZoom}>Reset Zoom</button>
      <div onWheel={handleWheelZoom}>
        <ResponsiveContainer
          height={height || 400}
          width={width}
          ref={chartRef}
        >
          <LineChart
            data={zoomedData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            onMouseDown={(e) => {
              setRefAreaLeft(Number(e.activeLabel));
              console.log(e);
            }}
            onMouseMove={(e) =>
              refAreaLeft !== null && setRefAreaRight(Number(e.activeLabel))
            }
            onMouseUp={handleZoom}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="x"
              label={{
                value: xAxisName,
                position: 'insideBottomRight',
                offset: -10,
              }}
              type="number"
              // domain={
              //   zoomedData.length > 0
              //     ? [zoomedData[0].x, 'auto']
              //     : ['auto', 'auto']
              // }
              domain={xDomain}
            />{' '}
            <YAxis
              dataKey="y"
              type="number"
              label={{ value: yAxisName, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={customTooltip} />
            <Legend />
            {uniqueNodes.map((node) => (
              <Line
                key={node}
                type="monotone"
                dataKey="y"
                data={zoomedData.filter((d) => d.nameNode === node)}
                name={node}
                stroke={nodeColors[node]}
                activeDot={{ r: 8 }}
              />
            ))}
            {refAreaLeft !== null && refAreaRight !== null ? (
              <ReferenceArea
                x1={refAreaLeft}
                x2={refAreaRight}
                strokeOpacity={0.3}
              />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Container>
  );
};
