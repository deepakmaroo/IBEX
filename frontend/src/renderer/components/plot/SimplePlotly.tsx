import { Layout } from 'plotly.js';
import { useEffect, useRef, useState } from 'react';
import Plot from 'react-plotly.js';
import { SimplePlotlyProps } from 'src/renderer/types';
import { ActionIcon, Group } from '@mantine/core';

import {
  IconDownload,
  IconLock,
  IconLockOpen,
  IconPencil,
  IconTrash,
} from '@tabler/icons-react';
import { useHover } from '@mantine/hooks';
import classes from './LineChart.module.css';

export const SimplePlotly = ({
  title,
  yAxisName,
  yAxis2Name,
  data,
  isStatic,
  handleDragStatic,
  handleDeleteGrid,
  handleUpdateGrid,
}: SimplePlotlyProps) => {
  const { hovered, ref } = useHover();
  const [layoutPlot, setLayoutPlot] = useState<Partial<Layout>>({});
  const plotRef = useRef<Plot | null>(null);

  /**
   * Update the layout of the plot
   */
  useEffect(() => {
    let layout: Partial<Layout> = {
      title: { text: title },

      autosize: true,
      modebar: {
        orientation: 'v',
        remove: ['toImage', 'pan2d'],
      },
      legend: {
        x: 1.1,
        y: 1,
        orientation: 'h',
      },
      showlegend: true,
    };

    if (yAxis2Name) {
      layout = {
        ...layout,
        yaxis2: {
          title: yAxis2Name,
          overlaying: 'y',
          side: 'right',
        },
      };
    }

    setLayoutPlot(layout);
  }, [title, yAxis2Name, yAxis2Name]);

  return (
    <div ref={ref}>
      {hovered && (
        <Group pos="absolute" right={30} top={5}>
          <ActionIcon
            variant="filled"
            aria-label="Download"
            className={classes.actionButton}
          >
            <IconDownload
              style={{ width: '70%', height: '70%' }}
              stroke={1.5}
            />
          </ActionIcon>
          <ActionIcon
            variant="filled"
            aria-label="Write"
            // onClick={handleUpdateGrid}
            className={classes.actionButton}
          >
            <IconPencil style={{ width: '70%', height: '70%' }} stroke={1.5} />
          </ActionIcon>
          <ActionIcon
            variant="filled"
            aria-label="Settings"
            // onClick={handleDragStatic}
            className={classes.actionButton}
          >
            {isStatic ? (
              <IconLock style={{ width: '70%', height: '70%' }} stroke={1.5} />
            ) : (
              <IconLockOpen
                style={{ width: '70%', height: '70%' }}
                stroke={1.5}
              />
            )}
          </ActionIcon>
          <ActionIcon
            variant="filled"
            aria-label="Trash"
            // onClick={handleDeleteGrid}
            className={classes.actionButton}
            color="red"
          >
            <IconTrash style={{ width: '70%', height: '70%' }} stroke={1.5} />
          </ActionIcon>
        </Group>
      )}
      <Plot
        ref={plotRef}
        data={data}
        layout={layoutPlot}
        config={{
          responsive: true,
        }}
        useResizeHandler={true}
        // style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
