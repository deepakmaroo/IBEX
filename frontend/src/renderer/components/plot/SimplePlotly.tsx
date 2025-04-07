import { Layout } from 'plotly.js';
import { useEffect, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import { SimplePlotlyProps } from 'src/renderer/types';
import { ActionIcon, Group } from '@mantine/core';
import { toPng } from 'html-to-image';

import {
  IconCheck,
  IconDownload,
  IconEdit,
  IconLock,
  IconLockOpen,
  IconTrash,
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
  handleDragStatic,
  handleDeleteGrid,
  handleEditGrid,
}: SimplePlotlyProps) => {
  const { hovered, ref } = useHover();
  const [layoutPlot, setLayoutPlot] = useState<Partial<Layout>>({});
  const plotRef = useRef<Plot | null>(null);
  const divRef = useRef<HTMLDivElement | null>(null);

  /**
   * Update the layout of the plot
   */
  useEffect(() => {
    let layout: Partial<Layout> = {
      title: { text: title },
      xaxis: {
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
        remove: ['toImage', 'pan2d'],
      },
      legend: {
        x: 1.1,
        y: 1,
        orientation: 'v',
      },
      showlegend: true,
      plot_bgcolor: '#c7c7c7',
      // paper_bgcolor: '#FFFFFF',
    };

    if (y2AxisName && y2AxisName !== '') {
      layout = {
        ...layout,
        yaxis2: {
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
        },
      };
    }

    setLayoutPlot(layout);
  }, [title, yAxisName, y2AxisName]);

  const exportToPNG = () => {
    if (divRef.current === null) {
      return;
    }

    toPng(divRef.current, { cacheBust: true })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'chart.png';
        link.click();
      })
      .catch((err) => {
        console.error('Failed to export chart as image', err);
      });
  };

  return (
    <div ref={ref}>
      {hovered && (
        <Group pos="absolute" right={30} top={5}>
          {handleEditGrid && (
            <ActionIcon
              variant="filled"
              aria-label="Settings"
              onClick={handleEditGrid}
              className={classes.actionButton}
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
          )}

          <ActionIcon
            variant="filled"
            aria-label="Download"
            className={classes.actionButton}
            onClick={exportToPNG}
          >
            <IconDownload
              style={{ width: '70%', height: '70%' }}
              stroke={1.5}
            />
          </ActionIcon>

          {handleDragStatic && (
            <ActionIcon
              variant="filled"
              aria-label="Settings"
              onClick={handleDragStatic}
              className={classes.actionButton}
            >
              {isStatic ? (
                <IconLock
                  style={{ width: '70%', height: '70%' }}
                  stroke={1.5}
                />
              ) : (
                <IconLockOpen
                  style={{ width: '70%', height: '70%' }}
                  stroke={1.5}
                />
              )}
            </ActionIcon>
          )}

          {handleDeleteGrid && (
            <ActionIcon
              variant="filled"
              aria-label="Trash"
              onClick={handleDeleteGrid}
              className={classes.actionButton}
              color="red"
            >
              <IconTrash style={{ width: '70%', height: '70%' }} stroke={1.5} />
            </ActionIcon>
          )}
        </Group>
      )}
      <div ref={divRef}>
        <Plot
          ref={plotRef}
          data={data}
          layout={layoutPlot}
          config={{
            autosizable: true,
          }}
          useResizeHandler={true}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};
