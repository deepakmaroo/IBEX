import { useCallback, useEffect, useState } from 'react';
import { Coordinates, DataGridPlot } from '../../../types';
import {
  fetchDataPlot,
  getArrayValueFromDependance,
  getFirstArrayValueFromShape,
  getVectorData,
  normalizeIndices,
} from '../../../utils';
import { showNotification } from '@mantine/notifications';
import { Button, Divider, Group, NumberInput, Stack, Text } from '@mantine/core';
import { IconCheck, IconRestore } from '@tabler/icons-react';

interface CustomizeDataRangeProps {
  customizedDataGrid: DataGridPlot;
  setCustomizedDataGrid: React.Dispatch<React.SetStateAction<DataGridPlot>>;
}
export const CustomizeDataRange = ({
  customizedDataGrid,
  setCustomizedDataGrid,
}: CustomizeDataRangeProps) => {
  // TODO : modifier cette fonction pour qu'elle reset les ranges en appelant le BE
  const getDownSampledData = async () => {
    try {
      //setIsLoadingRestore(true) // ? A remettre
      open();
      const updatedDataPlot = JSON.parse(
        JSON.stringify(customizedDataGrid),
      ) as DataGridPlot;

      let plotIndex = 0;
      for (const plot of updatedDataPlot.plot) {
        const dataPlotDownsampled = await fetchDataPlot(
          normalizeIndices(plot.nodeUri),
          // TODO : Appeler avec downsampling params SI présents
          // DataRangeMethod,
          // parseInt(dataRangeMax),
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
    } finally {
      //setIsLoadingRestore(false) // ? A remettre
      close();
    }
  };

  interface CoordinateRangeProps {
    coordinate: Coordinates;
  };
  
  const CoordinateRange = ({
    coordinate,
  }: CoordinateRangeProps) => {
    const minRange = coordinate?.range ? coordinate.range[0] : 0;
    const maxRange = coordinate?.range ? coordinate.range[1]
        :
      (
        typeof coordinate.shape !== "string" ? 
          coordinate.shape[coordinate.shape.length - 1] - 1
          :
          getFirstArrayValueFromShape(coordinate.data, coordinate.shape).length - 1
      )
    const [dataRangeMin, setDataRangeMin] = useState<number>(minRange);
    const [dataRangeMax, setDataRangeMax] = useState<number>(maxRange);
    const [isLoadingApply, setIsLoadingApply] = useState(false);
    const [isLoadingRestore, setIsLoadingRestore] = useState(false);

    const applyRange = () => {
      console.log("call applyRange");
      console.log("dataRangeMin : ", dataRangeMin);
      console.log("dataRangeMax : ", dataRangeMax);
      try {
        setIsLoadingApply(true);
        const updatedDataPlot = JSON.parse(JSON.stringify(customizedDataGrid)) as DataGridPlot;
        const updatedCoord = updatedDataPlot.coordinates.find((coord) => coord.axeIndex === coordinate.axeIndex)
        // ? Step 1 => range coordinate.data ; coordinate.valueIndex = 0 ; MAJ coordinate.shape ; coordinate?.range[minIndex, maxIndex] (si range restorable)
        // * coordinate?.range[minIndex, maxIndex] (si range restorable)
        updatedCoord.range = [dataRangeMin, dataRangeMax];

        // ? Step 2 => PLOTDATA POUR :: range plot.yData ; MAJ plot.x && plot.y ; MAJ plot.shape


        // ? Step 3 => PLOTDATA POUR :: range plot.error_bands.yData ; range plot.error_y.array && plot.error_y.arrayminus ; MAJ plot.shape


        console.log("customizedDataGrid applies : ", {
          ...customizedDataGrid,
          coordinates: updatedDataPlot.coordinates,
          // plot: updatedDataPlot.plot,
        });
        setCustomizedDataGrid({
          ...customizedDataGrid,
          coordinates: updatedDataPlot.coordinates,
          // plot: updatedDataPlot.plot,
        });
      } catch (error) {
        console.log("Error applying the range: ", error);
        
      } finally {
        setIsLoadingApply(false);
      }
      
    }

    const restoreRange = () => {
      console.log("call restoreRange");
      try {
        setIsLoadingRestore(true);
        const updatedDataPlot = JSON.parse(JSON.stringify(customizedDataGrid)) as DataGridPlot;
        const updatedCoord = updatedDataPlot.coordinates.find((coord) => coord.axeIndex === coordinate.axeIndex)
        // ? Step 1 => range coordinate.data ; coordinate.valueIndex = 0 ; MAJ coordinate.shape ; coordinate?.range[minIndex, maxIndex] (si range restorable)
        // * coordinate?.range[minIndex, maxIndex] (si range restorable)
        delete updatedCoord.range;

        // ? Step 2 => PLOTDATA POUR :: range plot.yData ; MAJ plot.x && plot.y ; MAJ plot.shape


        // ? Step 3 => PLOTDATA POUR :: range plot.error_bands.yData ; range plot.error_y.array && plot.error_y.arrayminus ; MAJ plot.shape


        console.log("customizedDataGrid restore : ", {
          ...customizedDataGrid,
          coordinates: updatedDataPlot.coordinates,
        });
        setCustomizedDataGrid({
          ...customizedDataGrid,
          coordinates: updatedDataPlot.coordinates,
        });
      } catch (error) {
        console.log("Error restoring the range: ", error);
        
      } finally {
        setIsLoadingRestore(false);
      }
      
    }

    const setInDataRange = useCallback((
      rangePosition: "min" | "max",
      value: number,
      setter: React.Dispatch<React.SetStateAction<number>>
    ) => {
        let checkedValue = value;
        if(checkedValue < minRange){
          checkedValue = minRange;
        } else if(checkedValue > maxRange){
          checkedValue = maxRange;
        }

        if(rangePosition === "min") {
          if(checkedValue > dataRangeMax){
            checkedValue = dataRangeMax;
          }
        } else {
          if(checkedValue < dataRangeMin){
            checkedValue = dataRangeMin;
          }
        }
        console.log("checkedValue : ",checkedValue);
        setter(checkedValue);
    }, [minRange, maxRange, dataRangeMin, dataRangeMax])

    return (
      <Group align="flex-end">
        <Group align="flex-end" justify="space-between">
          <NumberInput
            label="Min"
            description="Update the min range"
            placeholder="Update the min range"
            value={dataRangeMin}
            min={coordinate?.range ? coordinate.range[0] : 0}
            max={maxRange}
            onChange={(value: number) => setInDataRange("min", value, setDataRangeMin)}
            w={150}
          />
          <NumberInput
            label="Max"
            description="Update the max range"
            placeholder="Update the max range"
            value={dataRangeMax}
            min={coordinate?.range ? coordinate.range[0] : 0}
            max={maxRange}
            onChange={(value: number) => setInDataRange("max", value, setDataRangeMax)}
            w={150}
          />
        </Group>
        <Group align="flex-end" justify="space-between">
          <Button 
            onClick={applyRange} 
            loading={isLoadingApply}
            leftSection={<IconCheck size={20} />}
          >
            Apply
          </Button>
          <Button
            onClick={restoreRange}
            disabled={!coordinate?.range}
            loading={isLoadingRestore}
            variant='outline'
            leftSection={<IconRestore size={20} />}
          >
            Restore
          </Button>
        </Group>
      </Group>
    )
  }

  useEffect(() => {
    console.log("customizedDataGrid : ", customizedDataGrid);
    
  }, [customizedDataGrid])

  return (
    <Stack>
      {customizedDataGrid.coordinates.map((coord, index) => (
        <Stack key={`coord_data_range_${index}`}>
          <Divider label={coord.name} labelPosition="center"/>
          <CoordinateRange coordinate={coord} />
        </Stack>
      ))}
    </Stack>
  );
};
