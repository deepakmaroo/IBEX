import { Center, Grid, Group, Select, Text } from '@mantine/core';
import { Layout } from 'plotly.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import { Configuration, Coordinates, DataGridPlot } from 'src/renderer/types';
import { VerticalSlider } from '../verticalSlider';
import { useIbexStore } from '../../stores';
import {
  compareByAxeIndex,
  getArrayValueFromDependance,
  isMatrixPlottable,
  removeSuffix,
  swapAxis,
} from '../../utils';
import classes from './SimplePlotly.module.css';
import { NoDataForURI, PlotTitle } from '../plot';
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
      rangemode: 'normal',
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
      rangemode: 'normal',
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
  const [dataEntries, setDataEntries] = useState<string[]>([]);
  const plotRef = useRef<Plot | null>(null);
  const plotDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check data entries to update axes titles when needed
    const newDataEntries = [
      ...new Set(itemDataGrid.plot.map((plot) => plot.nodeUri.split('#')[0])),
    ];
    if (JSON.stringify(newDataEntries) !== JSON.stringify(dataEntries)) {
      setDataEntries(newDataEntries);
    }
  }, [itemDataGrid.plot]);

  const handleRelayout = (relayout: Partial<Layout>) => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      ...relayout, // update the layout with new values
    }));
  };

  const isPlotInY2 = useCallback(
    (plotName: string) => {
      const y2Unit = itemDataGrid?.y2AxisData?.unit;
      if (!y2Unit) return false;

      const selectedPlot = itemDataGrid.plot.find(
        (plot) => plot.name === plotName,
      );
      return selectedPlot?.unit === y2Unit;
    },
    [itemDataGrid?.y2AxisData?.unit, itemDataGrid?.plot],
  );

  useEffect(() => {
    const plotDiv = plotDivRef.current;
    if (!plotDiv) return;

    const applyLegendStyles = () => {
      const legendTexts =
        plotDiv.querySelectorAll<SVGTextElement>('.legendtext');

      legendTexts.forEach((el) => {
        const name = el.textContent || '';

        const isInY2 = isPlotInY2(name);
        const newColor = isInY2 ? 'rgb(148, 103, 189)' : 'rgb(68, 68, 68)';

        if (el.style.fill !== newColor) {
          el.style.fill = newColor;
        }
      });
    };

    // Apply styles to the first render
    applyLegendStyles();

    // Observe changes in the DOM to keep style (Plotly rewrites everything)
    const observer = new MutationObserver(() => {
      applyLegendStyles();
    });

    observer.observe(plotDiv, {
      childList: true,
      subtree: true,
    });

    // cleanup
    return () => observer.disconnect();
  }, [isPlotInY2]);

  /**
   * Update the layout title & dataPlot configuration when editing title
   */
  useEffect(() => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      title: { text: title },
    }));

    if (!itemDataGrid.isEditing) {
      return;
    }

    // Update title only if is editing
    const updatedDataPlot: DataGridPlot[] = JSON.parse(
      JSON.stringify(active.dataPlot),
    );
    for (const dataPlot of updatedDataPlot) {
      if (dataPlot.i === itemDataGrid.i) {
        dataPlot.title = title;
      }
    }

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
      width: width * (itemDataGrid.coordinates?.length > 1 ? 0.8 : 1) - 75,
    }));
  }, [width]);

  /**
   * Update the layout yAxis
   */
  useEffect(() => {
    const coordsYNames = itemDataGrid.plot
      .filter((plot) => plot.yaxis !== 'y2')
      ?.map((coord) => removeSuffix(coord.name, '_' + coord.labelUri));
    const YTitle = itemDataGrid.yAxisData?.name
      ? `${coordsYNames.length > 1 ? coordsYNames[0] + ', ...' : coordsYNames[0]} ${(itemDataGrid.yAxisData?.unit && '[' + itemDataGrid.yAxisData.unit + ']') || ''}`
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
  }, [itemDataGrid.yAxisData, dataEntries]);

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
  }, [itemDataGrid.xAxisData, dataEntries]);

  /**
   * Update the layout y2Axis
   */
  useEffect(() => {
    const coordsY2Names = itemDataGrid.plot
      .filter((plot) => plot.yaxis === 'y2')
      ?.map((coord) => removeSuffix(coord.name, '_' + coord.labelUri));
    const Y2Title = itemDataGrid.y2AxisData?.name
      ? `${coordsY2Names.length > 1 ? coordsY2Names[0] + ', ...' : coordsY2Names[0]} ${(itemDataGrid.y2AxisData?.unit && '[' + itemDataGrid.y2AxisData.unit + ']') || ''}`
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
              rangemode: 'normal',
              showline: false,
              zeroline: false,
              showgrid: false,
            }
          : {},
    }));
  }, [itemDataGrid.y2AxisData, dataEntries]);

  useEffect(() => {
    // Update title when itemDataGrid.title change (when selecting a plot with original plot title)
    setTitle(itemDataGrid.title);
  }, [itemDataGrid.title]);

  return (
    <Grid
      styles={{
        inner: {
          margin: 0,
          width: 'inherit',
          flexWrap: 'nowrap',
          whiteSpace: 'nowrap',
        },
      }}
    >
      {/* Coordinates sliders */}
      {itemDataGrid.coordinates.filter((coord) => coord.name !== '')?.length >
        1 &&
        sliderRef && (
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
                  itemDataGrid.coordinates.find(
                    (coord: Coordinates) => coord.axeIndex === 0,
                  ).name
                }
                data={itemDataGrid.coordinates.map(
                  (coord: Coordinates) => coord.name,
                )}
                w={`${width * 0.2}px`}
                onChange={(value) =>
                  value &&
                  swapAxis(
                    itemDataGrid,
                    active,
                    updatedConfiguration,
                    itemDataGrid.coordinates.find(
                      (coord: Coordinates) => coord.name === value,
                    ).axeIndex,
                    'x',
                  )
                }
                size="xs"
                disabled={!itemDataGrid.isEditing}
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

      {itemDataGrid.plot.every((plot) =>
        [plot.x, plot.y].every(isMatrixPlottable),
      ) ? (
        <>
          <PlotTitle
            itemDataGrid={itemDataGrid}
            title={title}
            setTitle={setTitle}
          />

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
            <div ref={plotDivRef}>
              <Plot
                ref={plotRef}
                className={classes.simplePlot}
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
            </div>
          </Grid.Col>
        </>
      ) : itemDataGrid.plot.some(
          (plot) => ![plot.x, plot.y, plot.yData].some(isMatrixPlottable),
        ) ? (
        <Grid.Col
          span="auto"
          pos="relative"
          w={'100%'}
          h={`${height}px`}
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Center h={height} w={`100%`}>
            <NoDataForURI itemDataGrid={itemDataGrid} />
          </Center>
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
          <Center h={height} w={`100%`}>
            <Text>Current index has no data</Text>
          </Center>
        </Grid.Col>
      )}
    </Grid>
  );
};
