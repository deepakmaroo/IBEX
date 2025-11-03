import { DataGridPlot, DataPlotly } from '../../types';
import { Stack, Text } from '@mantine/core';

interface NoDataForURIProps {
  itemDataGrid: DataGridPlot;
  selectedPlot?: DataPlotly;
}

export const NoDataForURI = ({
  itemDataGrid,
  selectedPlot,
}: NoDataForURIProps) => {
  return (
    <Stack gap={0}>
      <Text>No data found for:</Text>
      {selectedPlot // For selected plot from tab
        ? !selectedPlot.x.length &&
          !selectedPlot.y.length &&
          !selectedPlot.yData.length && (
            <Text>{`- '${selectedPlot.labelUri}' with path '${selectedPlot.path}'`}</Text>
          )
        : // Each plots
          itemDataGrid.plot.map(
            (unplottablePlot) =>
              !unplottablePlot.x.length &&
              !unplottablePlot.y.length &&
              !unplottablePlot.yData.length && (
                <Text>{`- '${unplottablePlot.labelUri}' with path '${unplottablePlot.path}'`}</Text>
              ),
          )}
    </Stack>
  );
};
