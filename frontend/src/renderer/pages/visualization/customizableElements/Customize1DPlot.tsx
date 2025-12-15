import { ColorInput, Stack } from '@mantine/core';
import { DataGridPlot, DataPlotly } from '../../../types';
import { useEffect, useState } from 'react';

interface Customize1DPlotProps {
  customizedDataGrid: DataGridPlot;
  selectedPlot: DataPlotly | null;
  setCustomizedDataGrid: React.Dispatch<React.SetStateAction<DataGridPlot>>;
}
export const Customize1DPlot = ({
  customizedDataGrid,
  selectedPlot,
  setCustomizedDataGrid,
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

  useEffect(() => {
    if (selectedPlot?.line?.color) {
      // Init color plot in component
      setColorPlot(selectedPlot.line.color);
    }
  }, [selectedPlot?.line]);

  return (
    <Stack>
      <ColorInput
        label="Plot color"
        description="Customize the plot color"
        placeholder="Customize the plot color"
        format="rgb"
        value={colorPlot}
        onChange={(value) => updatePlotColor(value)}
      />
    </Stack>
  );
};
