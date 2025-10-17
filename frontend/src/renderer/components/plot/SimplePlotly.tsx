import { Center, Grid, Group, Select, Text } from '@mantine/core';
import { Layout } from 'plotly.js';
import { useEffect, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import { Configuration, Coordinates, DataGridPlot } from 'src/renderer/types';
import { VerticalSlider } from '../verticalSlider';
import { useIbexStore } from '../../stores';
import {
  compareByAxeIndex,
  getArrayValueFromDependance,
  isMatrixPlottable,
  swapAxis,
} from '../../utils';
import classes from './SimplePlotly.module.css';
import { PlotTitle } from './PlotTitle';
interface SimplePlotlyProps {
  itemDataGrid: DataGridPlot;
  width: number;
  height: number;
  sliderRef?: React.RefObject<HTMLDivElement>;
  is3DView?: boolean;
  handleUpdateCoordinate?: (
    coordinate: Coordinates,
    valueIndex: number,
  ) => Promise<void>;
}

export const SimplePlotly = ({
  itemDataGrid,
  height,
  width,
  sliderRef,
  is3DView,
  handleUpdateCoordinate,
}: SimplePlotlyProps) => {
  const coordsUsedInAxes: 1 | 2 = 1;
  const { active, updatedConfiguration } = useIbexStore();
  const SELECT_AXIS_HEIGHT = 40; // Height of the select axis component
  const [layoutPlot, setLayoutPlot] = useState<Partial<Layout>>({
    xaxis: {
      title: {
        font: {
          family: 'Courier New, monospace',
          size: 16,
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
          size: 16,
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
  const plotRef = useRef<Plot | null>(null);

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
    if (!itemDataGrid.isTitleOverwritten) {
      setTitle(itemDataGrid.title || '');
    }
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
    const Y2Title = itemDataGrid.y2AxisData?.name
      ? `${itemDataGrid.y2AxisData?.name} ${(itemDataGrid.y2AxisData?.unit && '[' + itemDataGrid.y2AxisData.unit + ']') || ''}`
      : '';
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      yaxis2:
        itemDataGrid.y2AxisData && itemDataGrid.y2AxisData !== undefined
          ? {
              title: {
                text: Y2Title,
                font: {
                  family: 'Courier New, monospace',
                  size: 16,
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
      {itemDataGrid.coordinates.length > 0 &&
        sliderRef &&
        itemDataGrid.coordinates?.length > 1 && (
          <Grid.Col
            className={classes.handlePlotExplorationContainer}
            span="content"
            ref={sliderRef ? sliderRef : undefined}
            mt={10}
          >
            <Group gap={5}>
              <Text>x</Text>
              <Select
                label=""
                value={
                  JSON.parse(JSON.stringify(itemDataGrid.coordinates)).find(
                    (coord: Coordinates) => coord.axeIndex === 0,
                  ).name
                }
                data={JSON.parse(JSON.stringify(itemDataGrid.coordinates)).map(
                  (coord: Coordinates) => coord.name,
                )}
                w={`${width * 0.2}px`}
                onChange={(value) =>
                  value &&
                  swapAxis(
                    itemDataGrid,
                    active,
                    updatedConfiguration,
                    JSON.parse(JSON.stringify(itemDataGrid.coordinates)).find(
                      (coord: Coordinates) => coord.name === value,
                    ).axeIndex,
                    'x',
                  )
                }
                size="xs"
              />
            </Group>

            <Group
              justify="space-between"
              gap="0"
              w={`${width * 0.2}px`}
              miw={`${(itemDataGrid.coordinates.length - coordsUsedInAxes) * 50}px`}
              align="flex-end"
            >
              {JSON.parse(JSON.stringify(itemDataGrid.coordinates))
                .sort(compareByAxeIndex)
                .map(
                  (item: Coordinates, valueIndex: number) =>
                    item.axeIndex !== 0 && ( // Don't send coordinate having axeIndex 0 in verticalSlider because it's the x axis
                      <VerticalSlider
                        key={`line_slider_${valueIndex}`}
                        name={item.name}
                        valueIndex={item.valueIndex || 0}
                        data={getArrayValueFromDependance(
                          itemDataGrid.coordinates,
                          item.axeIndex,
                        )}
                        getValue={(valueIndex) =>
                          handleUpdateCoordinate(item, valueIndex)
                        }
                        maxWidth={
                          itemDataGrid.coordinates.length &&
                          itemDataGrid.coordinates.length > coordsUsedInAxes
                            ? 100 /
                              (itemDataGrid.coordinates.length -
                                coordsUsedInAxes)
                            : 100
                        }
                        height={
                          is3DView
                            ? height - 80
                            : height - 80 - SELECT_AXIS_HEIGHT
                        }
                        disabled={!itemDataGrid.isEditing}
                      />
                    ),
                )}
            </Group>
          </Grid.Col>
        )}
      <PlotTitle
        itemDataGrid={itemDataGrid}
        title={title}
        setTitle={setTitle}
      />
      {itemDataGrid.plot.every((plot) =>
        [plot.x, plot.y].every(isMatrixPlottable),
      ) ? (
        <Grid.Col
          span="auto"
          pos="relative"
          w={`${width * (itemDataGrid.coordinates?.length > 1 ? 0.8 : 1) - 32}px`}
          maw={`${width * (itemDataGrid.coordinates?.length > 1 ? 0.8 : 1) - 32}px`}
          h={`${height}px`}
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Plot
            ref={plotRef}
            className={classes.simplePlot}
            style={{
              maxWidth: `${width * (itemDataGrid.coordinates?.length > 1 ? 0.8 : 1) - 32}px !important`,
              height: `${height}px`,
            }}
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
      ) : (
        <Grid.Col
          span="auto"
          pos="relative"
          w={`${width}px`}
          maw={`${width}px`}
          h={`${height}px`}
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Center h={height}>
            <Text>Current index has no data</Text>
          </Center>
        </Grid.Col>
      )}
    </Grid>
  );
};
