import { Layout } from 'plotly.js';
import { useEffect, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import { SimplePlotlyProps } from 'src/renderer/types';
import { ActionIcon, Group, Tooltip } from '@mantine/core';

import {
  IconCheck,
  IconEdit,
  IconHandMove,
  IconTrash,
  IconZoomIn,
} from '@tabler/icons-react';
import { useHover } from '@mantine/hooks';
import classes from './SimplePlotly.module.css';

export const SimplePlotly = ({
  title,
  xAxisName,
  yAxisName,
  y2AxisName,
  data,
  isStatic,
  isEdit,
  height,
  width,
  handleDragStatic,
  handleDeleteGrid,
  handleEditGrid,
}: SimplePlotlyProps) => {
  const { hovered, ref: hoverRef } = useHover();
  const [layoutPlot, setLayoutPlot] = useState<Partial<Layout>>({});
  const plotRef = useRef<Plot | null>(null);
  const containerPlotRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleRelayout = (newLayout: Partial<Layout>) => {
    setLayoutPlot((prevLayout) => ({
      ...prevLayout,
      ...newLayout, // Merge le nouveau layout avec l'existant
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
      title: { text: title },
      xaxis: {
        ...prevLayout.xaxis,
        title: {
          text: xAxisName,
          font: {
            family: 'Courier New, monospace',
            size: 18,
            color: '#7f7f7f',
          },
        },
        showline: true,
      },
      yaxis: {
        ...prevLayout.yaxis,
        title: {
          text: yAxisName,
          font: {
            family: 'Courier New, monospace',
            size: 18,
            color: '#7f7f7f',
          },
        },
        showline: true,
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
        y2AxisName && y2AxisName !== ''
          ? {
              title: {
                text: y2AxisName,
                font: {
                  family: 'Courier New, monospace',
                  size: 18,
                  color: 'rgb(148, 103, 189)',
                },
              },
              tickfont: { color: 'rgb(148, 103, 189)' },
              overlaying: 'y',
              side: 'right',
              showline: true,
              zeroline: false,
            }
          : {},
      showlegend: true,
      plot_bgcolor: '#c7c7c7',
      dragmode: 'zoom',
    }));
  }, [title, xAxisName, yAxisName, height, width]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      ref={containerRef}
    >
      <div
        ref={hoverRef}
        className={classes.containerButton}
        style={{
          width: isStatic ? '95%' : '100%',
        }}
      >
        {(hovered || isStatic || isEdit) && (
          <Group pos="absolute" right={isStatic || isEdit ? 5 : 1} top={5}>
            {handleEditGrid && (
              <Tooltip
                label={isEdit ? 'Stop editing the grid' : 'Edit the grid'}
              >
                <ActionIcon
                  variant="filled"
                  aria-label="Editing"
                  onClick={handleEditGrid}
                  className={classes.actionButton}
                  color={isEdit ? 'yellow' : 'green'}
                >
                  {isEdit ? (
                    <IconCheck
                      style={{ width: '70%', height: '70%' }}
                      stroke={1.5}
                    />
                  ) : (
                    <IconEdit
                      style={{ width: '70%', height: '70%' }}
                      stroke={1.5}
                    />
                  )}
                </ActionIcon>
              </Tooltip>
            )}

            {handleDragStatic && (
              <Tooltip
                label={
                  isStatic
                    ? 'Zoom in/out the plot and stop dragging'
                    : 'Drag the plot'
                }
              >
                <ActionIcon
                  variant="filled"
                  aria-label="StaticLayout"
                  onClick={handleDragStatic}
                  className={classes.actionButton}
                >
                  {isStatic ? (
                    <IconHandMove
                      style={{ width: '70%', height: '70%' }}
                      stroke={1.5}
                    />
                  ) : (
                    <IconZoomIn
                      style={{ width: '70%', height: '70%' }}
                      stroke={1.5}
                    />
                  )}
                </ActionIcon>
              </Tooltip>
            )}

            {handleDeleteGrid && (
              <Tooltip label="Delete the grid">
                <ActionIcon
                  variant="filled"
                  aria-label="Delete"
                  onClick={handleDeleteGrid}
                  className={classes.actionButton}
                  color="red"
                >
                  <IconTrash
                    style={{ width: '70%', height: '70%' }}
                    stroke={1.5}
                  />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        )}
      </div>
      <div ref={containerPlotRef}>
        <Plot
          ref={plotRef}
          data={data}
          layout={layoutPlot}
          onRelayout={handleRelayout}
          config={{
            autosizable: false,
            staticPlot: !isStatic,
            scrollZoom: true,
            displayModeBar: true,
            showTips: true,
            displaylogo: false,
          }}
          useResizeHandler={false}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};
