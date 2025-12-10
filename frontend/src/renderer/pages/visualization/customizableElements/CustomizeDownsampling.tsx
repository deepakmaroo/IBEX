import { useEffect, useState } from 'react';
import { DataGridPlot } from '../../../types';
import {
  fetchDataPlot,
  fetchDownsamplingMethods,
  getArrayValueFromDependance,
  getVectorData,
  normalizeIndices,
} from '../../../utils';
import { showNotification } from '@mantine/notifications';
import { Select, Tooltip } from '@mantine/core';

interface CustomizeDownsamplingProps {
  customizedDataGrid: DataGridPlot;
  setCustomizedDataGrid: React.Dispatch<React.SetStateAction<DataGridPlot>>;
}
export const CustomizeDownsampling = ({
  customizedDataGrid,
  setCustomizedDataGrid,
}: CustomizeDownsamplingProps) => {
  const [downsamplingList, setDownsamplingList] = useState<string[]>([]);
  const [downsamplingMethod, setDownsamplingMethod] = useState<string | null>(
    null,
  );

  /*
   * Get downsampling methods to show in select
   */
  useEffect(() => {
    const getDownsamplingList = async () => {
      const methodsRes = await fetchDownsamplingMethods();
      setDownsamplingList(
        methodsRes.downsampling_methods.map((method) => method.name),
      );
    };
    getDownsamplingList();
  }, []);

  useEffect(() => {
    // Update downsampled method after a timeout
    if (customizedDataGrid.downsampled_method) {
      setDownsamplingMethod(customizedDataGrid.downsampled_method);
    }
  }, [customizedDataGrid.downsampled_method]);

  useEffect(() => {
    const getDataPlotDownsampled = async () => {
      try {
        const updatedDataPlot = JSON.parse(
          JSON.stringify(customizedDataGrid),
        ) as DataGridPlot;

        let plotIndex = 0;
        for (const plot of updatedDataPlot.plot) {
          const dataPlotDownsampled = await fetchDataPlot(
            normalizeIndices(plot.nodeUri),
            downsamplingMethod,
          );

          // Update coordinates with downsampled data only once because each plots have same coordinates
          if (plotIndex === 0) {
            let coordinateIndex = 0;
            for (const coordinate of updatedDataPlot.coordinates) {
              coordinate.downsampled_shape =
                dataPlotDownsampled.data.coordinates[
                  coordinateIndex
                ].downsampled_shape;
              coordinate.data =
                dataPlotDownsampled.data.coordinates[coordinateIndex].value;
              coordinateIndex++;
            }

            // Update downsampled method
            updatedDataPlot.downsampled_method =
              dataPlotDownsampled.data.downsampled_method;
          }

          // Update plot with downsampled data
          plot.shape = dataPlotDownsampled.data.downsampled_shape;
          // Get x axis switch coordinates dependances
          plot.x = getArrayValueFromDependance(updatedDataPlot.coordinates, 0);
          plot.yData = dataPlotDownsampled.data.value;
          // Get y axis
          const vectorData = getVectorData(
            updatedDataPlot.coordinates,
            plot.yData,
          );
          plot.y = vectorData;

          plotIndex++;
        }

        // Save new configuration with sampled data
        setCustomizedDataGrid({
          ...customizedDataGrid,
          downsampled_method: updatedDataPlot.downsampled_method,
          plot: updatedDataPlot.plot,
        });
      } catch (error) {
        console.error('Error getting downsampled data: ', error);
        showNotification({
          title: 'Error',
          message: `Unable to get downsampled data.`,
          color: 'red',
        });
      }
    };

    if (downsamplingMethod) {
      getDataPlotDownsampled();
    }
  }, [downsamplingMethod]);

  return (
    <Tooltip label="Select your downsampling method">
      <Select
        value={downsamplingMethod || 'None'}
        w="7rem"
        size="xs"
        data={downsamplingList}
        onChange={setDownsamplingMethod}
        placeholder="Downsampling"
      />
    </Tooltip>
  );
};
