import { Text } from "@mantine/core";
import { SimplePlot } from "../../components";
import { DataPlot } from "src/renderer/types";

export const VisualizationPlot = () => {
  
const rawData: DataPlot[] = [
  {
    nameNode: "Node1",
    valueX: [1000, 2000, 3000],
    valueY: [2400, 1398, 9800],
  },
  {
    nameNode: "Node2",
    valueX: [2000, 2500],
    valueY: [1398, 2500],
  },
  {
    nameNode: "Node3",
    valueX: [4588],
    valueY: [1500, 577],
  },
  {
    nameNode: "Node4",
    valueX: [3500],
    valueY: [1599],
  },
];

  return(
    <div>
      <Text>VisualizationPlot</Text>
      <SimplePlot
          data={rawData}
          xAxisName="Param1"
          yAxisName="Param2"
          height={400}
        />
    </div>
  )
};