import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState, useRef } from "react";
import { ActionIcon, Container } from "@mantine/core";
import { IconCamera } from "@tabler/icons-react";
import { toPng } from "html-to-image";
import { useHover } from "@mantine/hooks";
import { DataPlot } from "src/renderer/types";

interface SimplePlotProps {
  data: DataPlot[];
  xAxisName: string;
  yAxisName: string;
  width?: number;
  height?: number;
}

const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export const SimplePlot = ({
  data,
  xAxisName,
  yAxisName,
  height,
  width,
}: SimplePlotProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { hovered, ref } = useHover();

  const transformedData = data
    .map((node) => {
      const maxLength = node.valueY.length;
      const result = [];

      for (let i = 0; i < maxLength; i++) {
        result.push({
          nameNode: node.nameNode,
          x: node.valueX[i],
          y: node.valueY[i]
        });
      }

      return result;
    })
    .flat();

  const uniqueNodes = Array.from(
    new Set(transformedData.map((item) => item.nameNode))
  );

  // State to persist node colors
  const [nodeColors, setNodeColors] = useState<Record<string, string>>({});

  // Generate colors only once for each unique node
  useEffect(() => {
    const colors: Record<string, string> = {};
    uniqueNodes.forEach((node) => {
      if (!nodeColors[node]) {
        colors[node] = getRandomColor();
      }
    });
    if(colors.length){
      setNodeColors((prevColors) => ({ ...prevColors, ...colors }));
    }
  }, [uniqueNodes, nodeColors]);

  const customTooltip = ({ payload }: any) => {
    if (payload && payload.length > 0) {
      const { nameNode, x, y } = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "10px",
            border: "1px solid #ddd",
            borderRadius: "4px",
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

  const exportToPNG = () => {
    if (chartRef.current === null) {
      return;
    }

    toPng(chartRef.current, { cacheBust: true })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "chart.png";
        link.click();
      })
      .catch((err) => {
        console.error("Failed to export chart as image", err);
      });
  };

  return (
    <Container pos="relative" ref={ref as React.LegacyRef<HTMLDivElement>}>
      <ActionIcon
        variant="filled"
        aria-label="screen-plot"
        pos="absolute"
        size="lg"
        right={5}
        top={5}
        onClick={exportToPNG}
      >
        <IconCamera style={{ width: "70%", height: "70%" }} stroke={1.5} />
      </ActionIcon>
      <ResponsiveContainer height={height || 400} width={width} ref={chartRef}>
        <LineChart
          data={transformedData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="x"
            label={{
              value: xAxisName,
              position: "insideBottomRight",
              offset: -10,
            }}
            type="number"
          />

          <YAxis
            dataKey="y"
            type="number"
            label={{ value: yAxisName, angle: -90, position: "insideLeft" }}
          />

          <Tooltip content={customTooltip} />

          <Legend />

          {uniqueNodes.map((node) => (
            <Line
              key={node}
              type="monotone"
              dataKey="y"
              data={transformedData.filter((d) => d.nameNode === node)}
              name={node}
              stroke={nodeColors[node]} // Use the stored color
              activeDot={{ r: 8 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Container>
  );
};
