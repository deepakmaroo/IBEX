import { Grid, Group } from '@mantine/core';
import { Layout } from 'plotly.js';
import { useEffect, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import {
  Axis,
  Coordinates,
  DataGridPlot,
  SimplePlotlyProps,
} from 'src/renderer/types';
import { VerticalSlider } from '../verticalSlider';
import { useIbexStore } from '../../stores';
import {
  getLastIndexedField,
  getVectorData,
  updateIndexFieldName,
} from '../../utils';

export const SimplePlotly = ({
  itemDataGrid,
  height,
  width,
  sliderRef,
}: SimplePlotlyProps) => {
  const { active, updatedConfiguration } = useIbexStore();
  const [layoutPlot, setLayoutPlot] = useState<Partial<Layout>>({});

  const plotRef = useRef<Plot | null>(null);

  const handleRelayout = (newLayout: Partial<Layout>) => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      ...newLayout, // update the layout with new values
    }));
  };

  /**
   * Update the layout of the plot
   */
  useEffect(() => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      height: height,
      width: width,
      title: { text: itemDataGrid.title },
      xaxis: {
        ...prevLayout.xaxis,
        title: {
          text: itemDataGrid.xAxisData?.name || '',
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
        ...prevLayout.yaxis,
        title: {
          text: itemDataGrid.yAxisData?.unit || '',
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
      plot_bgcolor: '#c7c7c7',
      // paper_bgcolor: "#c8b8b8",
      dragmode: 'zoom',
    }));
  }, [itemDataGrid, height, width]);

  /**
   * Update the coordinates when the slider is moved
   */
  const handleUpdateCoordinate = async (
    coordinate: Coordinates,
    index: number,
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
        index,
      );

      return {
        ...item,
        target: updatedTarget, // Update the target to the new one
        index: item.name === coordinate.name ? index : item.index,
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
              index,
            ),
          };

          const updatedPlot = item.plot.map((plotItem) => {
            const updatedNodeUri = updateIndexFieldName(
              plotItem.nodeUri,
              lastTargetLastName,
              index,
            );

            const updatedPath = updateIndexFieldName(
              plotItem.path || '',
              lastTargetLastName,
              index,
            );

            const newYData = getVectorData(
              updatedNodeUri,
              item.coordinates,
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
        <Grid.Col span={2} ref={sliderRef}>
          <Group justify="space-between" gap="0">
            {itemDataGrid.coordinates.map((item, index) => (
              <VerticalSlider
                key={index}
                name={item.name}
                index={item.index || 0}
                data={item.data}
                getValue={(index) => {
                  handleUpdateCoordinate(item, index);
                }}
                height={height - 80}
                disabled={!itemDataGrid.isEditing}
              />
            ))}
          </Group>
        </Grid.Col>
      )}

      <Grid.Col
        span={itemDataGrid.coordinates.length > 0 ? 10 : 12}
        pos="relative"
        w="100%"
        h="100%"
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
          style={{ width: '100%', height: '100%' }}
        />
      </Grid.Col>
    </Grid>
  );
};
