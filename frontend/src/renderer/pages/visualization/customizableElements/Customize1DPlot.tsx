import { ColorInput, Group, Stack, Button, Tooltip } from '@mantine/core';
import { DataGridPlot, DataPlotly } from '../../../types';
import { useEffect, useState } from 'react';

interface Customize1DPlotProps {
  customizedDataGrid: DataGridPlot;
  selectedPlot: DataPlotly | null;
  setCustomizedDataGrid: React.Dispatch<React.SetStateAction<DataGridPlot>>;
  initPlotColors: () => void;
}
export const Customize1DPlot = ({
  customizedDataGrid,
  selectedPlot,
  setCustomizedDataGrid,
  initPlotColors,
}: Customize1DPlotProps) => {
  const [colorPlot, setColorPlot] = useState(selectedPlot?.line?.color || '');

  const updatePlotColor = (newColor: string) => {
    const updatedDataPlot = JSON.parse(
      JSON.stringify(customizedDataGrid),
    ) as DataGridPlot;

    const updatedLine = selectedPlot?.line || {};
    updatedLine.color = newColor;
    updatedDataPlot.plot.find((plot) => plot.name === selectedPlot.name).line =
      updatedLine;

    setCustomizedDataGrid({
      ...customizedDataGrid,
      plot: updatedDataPlot.plot,
    });
    setColorPlot(newColor);
  };

  const resetPlotColors = () => {
    const updatedPlots = JSON.parse(JSON.stringify(customizedDataGrid.plot));
    for (const plot of updatedPlots) {
      if (plot?.line?.color) {
        delete plot.line.color;
      }
    }

    setColorPlot('');
    setCustomizedDataGrid({ ...customizedDataGrid, plot: updatedPlots });
  };

  useEffect(() => {
    if (selectedPlot?.line?.color) {
      // Init color plot in component
      setColorPlot(selectedPlot.line.color);
    } else {
      initPlotColors();
    }
  }, [selectedPlot?.line]);

  return (
    <Stack>
      <Group align="flex-end">
        <ColorInput
          label="Plot color"
          description="Customize the plot color"
          placeholder="Customize the plot color"
          format="rgb"
          value={colorPlot}
          onChange={(value) => updatePlotColor(value)}
        />
        <Tooltip label="Reset color of each plot" position="bottom-start">
          <Button variant="outline" onClick={resetPlotColors}>
            Reset plot colors
          </Button>
        </Tooltip>
      </Group>
    </Stack>
  );
};
