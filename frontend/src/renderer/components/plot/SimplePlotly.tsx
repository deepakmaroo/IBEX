import { Grid, Group } from '@mantine/core';
import { Layout } from 'plotly.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import { Axis, Coordinates, DataGridPlot } from 'src/renderer/types';
import { VerticalSlider } from '../verticalSlider';
import { useIbexStore } from '../../stores';
import {
  compareByAxeIndex,
  getFirstArrayValueFromShape,
  getLastIndexedField,
  getVectorData,
  updateIndexFieldName,
} from '../../utils';
import classe from './SimplePlotly.module.css';
import * as tf from '@tensorflow/tfjs';

interface SimplePlotlyProps {
  itemDataGrid: DataGridPlot;
  width: number;
  height: number;
  sliderRef?: React.RefObject<HTMLDivElement>;
  is3DView?: boolean;
}

export const SimplePlotly = ({
  itemDataGrid,
  height,
  width,
  sliderRef,
  is3DView,
}: SimplePlotlyProps) => {
  const { active, updatedConfiguration } = useIbexStore();
  const BUTTON_SWITCH_HEIGHT = 24; // Height of the switch button
  const [layoutPlot, setLayoutPlot] = useState<Partial<Layout>>({
    xaxis: {
      title: {
        font: {
          family: 'Courier New, monospace',
          size: 18,
          color: '#7f7f7f',
        },
      },
      rangemode: 'tozero',
      showline: true,
      zeroline: false,
    },
    yaxis: {
      title: {
        font: {
          family: 'Courier New, monospace',
          size: 18,
          color: '#7f7f7f',
        },
      },
      rangemode: 'tozero',
      showline: true,
      zeroline: false,
      showgrid: true,
    },
    modebar: {
      orientation: 'v',
    },
    legend: {
      x: 1.1,
      y: 1,
      orientation: 'v',
    },
    plot_bgcolor: '#c7c7c7',
    dragmode: 'zoom',
  });
  const plotRef = useRef<Plot | null>(null);

  const handleRelayout = (newLayout: Partial<Layout>) => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      ...newLayout, // update the layout with new values
    }));
  };

  /**
   * Update the layout title
   */
  useEffect(() => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      title: { text: itemDataGrid.title || '' },
    }));
  }, [itemDataGrid.title]);

  /**
   * Update the layout height
   */
  useEffect(() => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      height: height,
    }));
  }, [height]);

  /**
   * Update the layout width
   */
  useEffect(() => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      width: width,
    }));
  }, [width]);

  /**
   * Update the layout yAxis
   */
  useEffect(() => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      yaxis: {
        ...prevLayout.yaxis,
        title: {
          ...prevLayout.yaxis.title,
          text: itemDataGrid.yAxisData?.unit || '',
        },
      },
    }));
  }, [itemDataGrid.yAxisData]);

  /**
   * Update the layout xAxis
   */
  useEffect(() => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      xaxis: {
        ...prevLayout.xaxis,
        title: {
          ...prevLayout.xaxis.title,
          text: itemDataGrid.xAxisData?.name || '',
        },
      },
    }));
  }, [itemDataGrid.xAxisData]);

  /**
   * Update the layout y2Axis
   */
  useEffect(() => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      yaxis2:
        itemDataGrid.y2AxisData && itemDataGrid.y2AxisData !== undefined
          ? {
              title: {
                text: itemDataGrid.y2AxisData?.unit || '',
                font: {
                  family: 'Courier New, monospace',
                  size: 18,
                  color: 'rgb(148, 103, 189)',
                },
              },
              tickfont: { color: 'rgb(148, 103, 189)' },
              overlaying: 'y',
              side: 'right',
              rangemode: 'tozero',
              showline: false,
              zeroline: false,
              showgrid: false,
            }
          : {},
    }));
  }, [itemDataGrid.y2AxisData]);

  /**
   * updateslider coordinate value
   */
  const handleUpdateCoordinate = async (
    coordinate: Coordinates,
    valueIndex: number,
  ) => {
    // Check if the coordinate has a target
    const lastTargetLastName = getLastIndexedField(coordinate.target);
    if (!lastTargetLastName)
      return console.warn('No indexed field found in target');

    const updatedCoordinatesValue = itemDataGrid.coordinates.map((item) => {
      const lastTargetLastName = getLastIndexedField(coordinate.target);

      const updatedTarget = updateIndexFieldName(
        item.target,
        lastTargetLastName,
        valueIndex,
      );

      return {
        ...item,
        target: updatedTarget, // Update the target to the new one
        valueIndex:
          item.name === coordinate.name ? valueIndex : item.valueIndex,
      };
    });

    const updatedActive = {
      ...active,
      dataPlot: active.dataPlot.map((item: DataGridPlot) => {
        if (item.i === itemDataGrid.i) {
          const updatedXAxisData: Axis = {
            ...item.xAxisData,
            path: updateIndexFieldName(
              item.xAxisData?.path || '',
              lastTargetLastName,
              valueIndex,
            ),
          };

          const updatedPlot = item.plot.map((plotItem) => {
            const updatedNodeUri = updateIndexFieldName(
              plotItem.nodeUri,
              lastTargetLastName,
              valueIndex,
            );

            const updatedPath = updateIndexFieldName(
              plotItem.path || '',
              lastTargetLastName,
              valueIndex,
            );

            const newYData = getVectorData(
              updatedNodeUri,
              updatedCoordinatesValue,
              plotItem.yData,
            );

            return {
              ...plotItem,
              y: newYData,
              nodeUri: updatedNodeUri,

              path: updatedPath,
            };
          });

          return {
            ...item,
            coordinates: updatedCoordinatesValue,
            plot: updatedPlot,
            xAxisData: updatedXAxisData,
          };
        }

        return item;
      }),
    };

    updatedConfiguration(updatedActive);
  };

  async function transposeAxis(
    updatedDataPlot: DataGridPlot,
    axeIndexToSwitch: number,
  ) {
    // Modify each plot in graph
    for (const plotToTranspose of updatedDataPlot.plot) {
      const tensor = tf.tensor(plotToTranspose.yData);
      // Determine which axis to transpose
      const coordinatesLength = updatedDataPlot.coordinates.length - 1;
      const newAxeOrder = updatedDataPlot.coordinates.map((coord, index) => ({
        newPosition: index,
        axeIndex: coordinatesLength - index,
      }));
      const indexOfAxeIndexSelected = newAxeOrder.findIndex(
        (newShapeElement) => newShapeElement.axeIndex === axeIndexToSwitch,
      );
      newAxeOrder[coordinatesLength].newPosition =
        newAxeOrder[indexOfAxeIndexSelected].newPosition; // last element position is switched with selected axeIndex
      newAxeOrder[indexOfAxeIndexSelected].newPosition = coordinatesLength; // set selected axeIndex to last position
      const newPositions = newAxeOrder.map((fixed) => fixed.newPosition);

      // Transpose dataY
      const transposed = tf.transpose(tensor, newPositions);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dataYTransposed: any = await transposed.array();

      // Update yData & shape
      plotToTranspose.yData = dataYTransposed;
      plotToTranspose.shape = transposed.shape;
    }
  }

  const switchAxis = useCallback(
    async (axeIndexToSwitch: number) => {
      const actualXAxisIndex: number = itemDataGrid.coordinates.findIndex(
        (coordinate) => coordinate.axeIndex === 0,
      );
      const itemToSwitchIndex: number = itemDataGrid.coordinates.findIndex(
        (coordinate) => coordinate.axeIndex === axeIndexToSwitch,
      );

      const updatedDataPlotList: DataGridPlot[] = JSON.parse(
        JSON.stringify(active.dataPlot),
      );
      const updatedDataPlot = updatedDataPlotList.find(
        (dataPlotToUpdate) => dataPlotToUpdate.i === itemDataGrid.i,
      );

      // Switch xAxis
      updatedDataPlot.coordinates[actualXAxisIndex].axeIndex = axeIndexToSwitch;
      updatedDataPlot.coordinates[itemToSwitchIndex].axeIndex = 0;

      // Reset indexValue
      updatedDataPlot.coordinates[actualXAxisIndex].valueIndex = 0;
      updatedDataPlot.coordinates[itemToSwitchIndex].valueIndex = 0;

      // Update all coordinates targets impacted with resetted indexValue
      const actualXAxisTargetLastName = getLastIndexedField(
        updatedDataPlot.coordinates[actualXAxisIndex].target,
      );
      const itemToSwitchTargetLastName = getLastIndexedField(
        updatedDataPlot.coordinates[itemToSwitchIndex].target,
      );
      const actualXAxisupdatedPath = updateIndexFieldName(
        updatedDataPlot.coordinates[actualXAxisIndex].target || '',
        actualXAxisTargetLastName,
        0,
      );
      updateIndexFieldName(
        actualXAxisupdatedPath,
        itemToSwitchTargetLastName,
        0,
      );
      const itemToSwitchupdatedPath = updateIndexFieldName(
        updatedDataPlot.coordinates[itemToSwitchIndex].target || '',
        itemToSwitchTargetLastName,
        0,
      );
      updateIndexFieldName(
        itemToSwitchupdatedPath,
        actualXAxisTargetLastName,
        0,
      );

      // Modify targets from each coordinates
      for (const coordinate of updatedDataPlot.coordinates) {
        coordinate.target = updateIndexFieldName(
          coordinate.target || '',
          itemToSwitchTargetLastName,
          0,
        );
        coordinate.target = updateIndexFieldName(
          coordinate.target,
          actualXAxisTargetLastName,
          0,
        );
      }

      // Set new xAxis plot
      updatedDataPlot.xAxisData.name =
        updatedDataPlot.coordinates[itemToSwitchIndex].name;
      updatedDataPlot.xAxisData.path =
        updatedDataPlot.coordinates[itemToSwitchIndex].target;
      updatedDataPlot.xAxisData.unit =
        updatedDataPlot.coordinates[itemToSwitchIndex].unit;

      // Transpose yData with resetted valueIndex
      await transposeAxis(updatedDataPlot, axeIndexToSwitch);

      // Update x & y with translated dataY
      for (const plot of updatedDataPlot.plot) {
        const firstArrayValue = getFirstArrayValueFromShape(
          plot.yData,
          plot.shape,
        );
        plot.y = firstArrayValue;
        const xCoordinate = updatedDataPlot.coordinates.find(
          (coord) => coord.axeIndex === 0,
        );
        plot.x = xCoordinate.data;
      }
      const updatedActive = {
        ...active,
        dataPlot: updatedDataPlotList,
      };

      updatedConfiguration(updatedActive);
    },
    [active],
  );

  return (
    <Grid
      styles={{
        inner: {
          margin: 0,
          width: 'inherit',
        },
      }}
    >
      {/* Coordinates sliders */}
      {itemDataGrid.coordinates.length > 0 && (
        <Grid.Col span="content" ref={sliderRef ? sliderRef : undefined} mt={10}>
          <Group justify="space-between" gap="0">
            {JSON.parse(JSON.stringify(itemDataGrid.coordinates))
              .sort(compareByAxeIndex)
              .map(
                (item: Coordinates, valueIndex: number) =>
                  item.axeIndex !== 0 && ( // Don't send coordinate having axeIndex 0 in verticalSlider because it's the x axis
                    <VerticalSlider
                      key={valueIndex}
                      name={item.name}
                      valueIndex={item.valueIndex || 0}
                      data={item.data}
                      getValue={(valueIndex) => {
                        handleUpdateCoordinate(item, valueIndex);
                      }}
                      switchAxis={() => switchAxis(item.axeIndex)}
                      height={
                        is3DView
                          ? height - 80
                          : height - 80 - BUTTON_SWITCH_HEIGHT
                      }
                      disabled={!itemDataGrid.isEditing}
                    />
                  ),
              )}
          </Group>
        </Grid.Col>
      )}

      <Grid.Col
        span="auto"
        pos="relative"
        w={`${width}px`}
        h={`${height}px`}
        style={{
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Plot
          ref={plotRef}
          data={itemDataGrid.plot}
          layout={layoutPlot}
          onRelayout={handleRelayout}
          config={{
            autosizable: false,
            staticPlot: !itemDataGrid.static,
            scrollZoom: true,
            displayModeBar: true,
            showTips: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['lasso2d', 'select2d'],
          }}
          useResizeHandler={false}
          style={{ width: `${width}px`, height: `${height}px` }}
          className={classe.simplePlot}
        />
      </Grid.Col>
    </Grid>
  );
};
