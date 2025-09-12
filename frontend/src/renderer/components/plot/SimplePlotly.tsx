import { Grid, Group } from '@mantine/core';
import { Layout } from 'plotly.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import {
  Axis,
  Configuration,
  Coordinates,
  DataGridPlot,
} from 'src/renderer/types';
import { VerticalSlider } from '../verticalSlider';
import { useIbexStore } from '../../stores';
import {
  compareByAxeIndex,
  getFirstArrayValueFromShape,
  getArrayValueFromDependance,
  getLastIndexedField,
  getVectorData,
  updateIndexFieldName,
  fetchDataPlot,
  normalizeIndices,
  getDefaultUri,
} from '../../utils';
import classes from './SimplePlotly.module.css';
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

  const [title, setTitle] = useState(itemDataGrid.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const plotRef = useRef<Plot | null>(null);

  const handleBlurTitle = () => {
    if (titleRef.current) {
      setTitle(titleRef.current.innerText || 'Untitled');
    }
    setIsEditingTitle(false);
  };

  const handleKeyDownTitle = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (titleRef.current) {
        setTitle(titleRef.current.innerText || 'Untitled');
      }
      setIsEditingTitle(false);
    }
  };

  const handleRelayout = (relayout: Partial<Layout>) => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      ...relayout, // update the layout with new values
    }));
  };

  /**
   * Update the editable title when layout title change
   */
  useEffect(() => {
    setTitle(itemDataGrid.title || '');
  }, [itemDataGrid.title]);

  /**
   * Update the layout title & dataPlot configuration when editing title
   */
  useEffect(() => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      title: { text: title },
    }));

    const updatedDataPlot: DataGridPlot[] = active.dataPlot.map(
      (item: DataGridPlot) => {
        if (item.i === itemDataGrid.i) {
          return {
            ...itemDataGrid,
            title: title,
          };
        }
        return item;
      },
    );

    const newActive: Configuration = {
      ...active,
      saved: false,
      dataPlot: updatedDataPlot,
    };

    updatedConfiguration(newActive);
  }, [title]);

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
    const YTitle = itemDataGrid.yAxisData?.name
      ? `${itemDataGrid.yAxisData?.name} ${(itemDataGrid.yAxisData?.unit && '[' + itemDataGrid.yAxisData.unit + ']') || ''}`
      : '';
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      yaxis: {
        ...prevLayout.yaxis,
        title: {
          ...prevLayout.yaxis.title,
          text: YTitle,
        },
      },
    }));
  }, [itemDataGrid.yAxisData]);

  /**
   * Update the layout xAxis
   */
  useEffect(() => {
    const XTitle = itemDataGrid.xAxisData?.name
      ? `${itemDataGrid.xAxisData?.name} ${(itemDataGrid.xAxisData?.unit && '[' + itemDataGrid.xAxisData.unit + ']') || ''}`
      : '';
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      xaxis: {
        ...prevLayout.xaxis,
        title: {
          ...prevLayout.xaxis.title,
          text: XTitle,
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

    let updatedDimension: DataGridPlot;
    // Update plot with new selected dimension
    if (coordinate?.isDimensionCoordinate) {
      // Get dataGrid to update
      updatedDimension = JSON.parse(JSON.stringify(itemDataGrid));

      const normalizedUri = normalizeIndices(itemDataGrid.plot[0].nodeUri); //Use normalized URI to get all matrix
      const newUri = normalizedUri.replace(
        `${coordinate.name}[:]`,
        `${coordinate.name}[${valueIndex}]`,
      );
      const newRes = await fetchDataPlot(newUri);

      // Add information indicating that this coordinate is used to select the dimension
      newRes.data.coordinates.find(
        (coord) => coord.name === coordinate.name,
      ).isDimensionCoordinate = true;

      // Update coordinates
      let resettedAxeIndex = 0;
      for (const coordinate of updatedDimension.coordinates) {
        const newCoord = newRes.data.coordinates.find(
          (newCoord) =>
            normalizeIndices(newCoord.target) ===
            normalizeIndices(coordinate.target),
        );
        coordinate.axeIndex = resettedAxeIndex;
        coordinate.shape = newCoord.shape;
        coordinate.coordinates = newCoord.coordinates;
        coordinate.target = newCoord.target;
        coordinate.data = newCoord.value;
        coordinate.valueIndex = 0;
        resettedAxeIndex++;
      }

      // Update plots
      for (const plot of updatedDimension.plot) {
        plot.path = newRes.data.path;
        plot.shape = newRes.data.shape as number[];
        plot.yData = newRes.data.value;
      }

      // Update xAxisData
      const xAxis = updatedDimension.coordinates.find(
        (coord) => coord.axeIndex === 0,
      );
      updatedDimension.xAxisData.name = xAxis.name;
      updatedDimension.xAxisData.path = getDefaultUri(
        newRes.data.coordinates[0].path,
      );
      updatedDimension.xAxisData.unit = xAxis.unit;
    }

    if (updatedDimension) {
      itemDataGrid = updatedDimension;
    }

    // Update coordinates targets & paths with new valueIndex
    const updatedCoordinatesValue = itemDataGrid.coordinates.map((item) => {
      const lastTargetLastName = getLastIndexedField(coordinate.target);

      const updatedPath = updateIndexFieldName(
        item.path,
        lastTargetLastName,
        valueIndex,
      );
      const updatedTarget = updateIndexFieldName(
        item.target,
        lastTargetLastName,
        valueIndex,
      );

      return {
        ...item,
        path: updatedPath,
        target: updatedTarget,
        valueIndex:
          item.name === coordinate.name ? valueIndex : item.valueIndex,
      };
    });

    const updatedActive: Configuration = {
      ...active,
      dataPlot: active.dataPlot.map((item: DataGridPlot) => {
        if (item.i === itemDataGrid.i) {
          const updatedXAxisData: Axis = {
            ...itemDataGrid.xAxisData,
            path: updateIndexFieldName(
              itemDataGrid.xAxisData?.path || '',
              lastTargetLastName,
              valueIndex,
            ),
          };

          // Get x values switch x dependances
          const newXData = getArrayValueFromDependance(
            updatedCoordinatesValue,
            0,
          );

          const updatedPlot = itemDataGrid.plot.map((plotItem) => {
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
              updatedCoordinatesValue,
              plotItem.yData,
            );

            return {
              ...plotItem,
              x: newXData,
              y: newYData,
              nodeUri: updatedNodeUri,

              path: updatedPath,
            };
          });

          return {
            ...itemDataGrid,
            coordinates: updatedCoordinatesValue,
            plot: updatedPlot,
            xAxisData: updatedXAxisData,
          };
        }

        return item;
      }) as DataGridPlot[],
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

      // Update all coordinates targets & paths impacted with resetted indexValue
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

        coordinate.path = updateIndexFieldName(
          coordinate.path || '',
          itemToSwitchTargetLastName,
          0,
        );
        coordinate.path = updateIndexFieldName(
          coordinate.path,
          actualXAxisTargetLastName,
          0,
        );
      }

      // Set new xAxis plot
      updatedDataPlot.xAxisData.name =
        updatedDataPlot.coordinates[itemToSwitchIndex].name;
      updatedDataPlot.xAxisData.path =
        updatedDataPlot.coordinates[itemToSwitchIndex].path;
      updatedDataPlot.xAxisData.unit =
        updatedDataPlot.coordinates[itemToSwitchIndex].unit;

      // Transpose yData with resetted valueIndex
      await transposeAxis(updatedDataPlot, axeIndexToSwitch);

      // Update x & y with translated dataY
      for (const plot of updatedDataPlot.plot) {
        const vectorData = getVectorData(
          updatedDataPlot.coordinates,
          plot.yData,
        );
        plot.y = vectorData;
        // Get x values switch x dependances
        plot.x = getArrayValueFromDependance(updatedDataPlot.coordinates, 0);
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
      {itemDataGrid.coordinates.length > 0 && sliderRef && (
        <Grid.Col
          span="content"
          ref={sliderRef ? sliderRef : undefined}
          mt={10}
        >
          <Group justify="space-between" gap="0" align="flex-end">
            {JSON.parse(JSON.stringify(itemDataGrid.coordinates))
              .sort(compareByAxeIndex)
              .map(
                (item: Coordinates, valueIndex: number) =>
                  item.axeIndex !== 0 && ( // Don't send coordinate having axeIndex 0 in verticalSlider because it's the x axis
                    <VerticalSlider
                      key={valueIndex}
                      name={item.name}
                      valueIndex={item.valueIndex || 0}
                      data={getFirstArrayValueFromShape(
                        item.data,
                        item.shape as number[],
                      )}
                      getValue={(valueIndex) => {
                        handleUpdateCoordinate(item, valueIndex);
                      }}
                      switchAxis={
                        !item.isDimensionCoordinate
                          ? () => switchAxis(item.axeIndex)
                          : undefined
                      }
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
        <div className={classes.editableTitle}>
          <span
            ref={titleRef}
            className={itemDataGrid.isEditing ? classes.isEditing : undefined}
            contentEditable={isEditingTitle && itemDataGrid.isEditing}
            suppressContentEditableWarning
            onClick={() => setIsEditingTitle(true)}
            onBlur={handleBlurTitle}
            onKeyDown={handleKeyDownTitle}
          >
            {title}
          </span>
        </div>

        <Plot
          ref={plotRef}
          className={classes.simplePlot}
          style={{ width: `${width}px`, height: `${height}px` }}
          data={itemDataGrid.plot}
          config={{
            autosizable: false,
            staticPlot: !itemDataGrid.static,
            scrollZoom: true,
            displayModeBar: true,
            showTips: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['lasso2d', 'select2d'],
          }}
          layout={layoutPlot}
          onRelayout={handleRelayout}
          useResizeHandler={false}
        />
      </Grid.Col>
    </Grid>
  );
};
