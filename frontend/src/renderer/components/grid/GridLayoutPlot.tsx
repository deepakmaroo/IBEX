import { useCallback, useRef } from 'react';
import {
  Configuration,
  DataGridPlot,
  GridLayoutPlotProps,
} from 'src/renderer/types';
import { ActionIcon, Group, Tooltip } from '@mantine/core';

import {
  IconBrandDatabricks,
  IconCheck,
  IconEdit,
  IconHandMove,
  IconTrash,
  IconZoomIn,
} from '@tabler/icons-react';
import { useHover } from '@mantine/hooks';
import classes from './GridLayoutPlot.module.css';
import { SimplePlotly } from '../plot';
import { useIbexStore } from '../../stores';

export const GridLayoutPlot = ({
  data,
  colWidth,
  rowHeight,
}: GridLayoutPlotProps) => {
  const { active, updatedConfiguration } = useIbexStore();
  const { hovered, ref: hoverRef } = useHover();
  const containerRef = useRef<HTMLDivElement | null>(null);

  /**
   * Handle the drag static event
   */
  const handleDragStatic = useCallback(
    (id: string) => {
      const newDataPlot: DataGridPlot[] = active.dataPlot.map(
        (item: DataGridPlot) => {
          if (item.i === id) {
            return { ...item, static: !item.static };
          }
          return { ...item, static: false, isEditing: false };
        },
      );
      const newActive: Configuration = {
        ...active,
        saved: false,
        dataPlot: newDataPlot,
      };

      updatedConfiguration(newActive);
    },
    [active],
  );

  /**
   * Handle the delete grid event
   */
  const handleDeleteGrid = useCallback(
    (id: string) => {
      const newDataPlot: DataGridPlot[] = active.dataPlot.filter(
        (item: DataGridPlot) => item.i !== id,
      );
      const newActive: Configuration = {
        ...active,
        saved: false,
        dataPlot: newDataPlot,
        checkedNodeURI: [],
      };

      updatedConfiguration(newActive);
    },
    [active],
  );

  /**
   * Handle edit grid event
   */
  const handleEditGrid = useCallback(
    (id: string) => {
      const findPlot = active.dataPlot.find((item) => item.i === id);
      if (!findPlot) return;

      const updatedDataPlot = active.dataPlot.map((item) =>
        item.i === id
          ? { ...item, isEditing: !item.isEditing }
          : { ...item, isEditing: false, static: false },
      );

      updatedConfiguration({
        ...active,
        saved: false,
        dataPlot: updatedDataPlot,
        checkedNodeURI: findPlot.isEditing
          ? []
          : findPlot.plot.map((item) => item.nodeUri),
      });
    },
    [active],
  );

  const handleInspectMetadata = useCallback(
    (id: string) => {
      const updateActive: Configuration = {
        ...active,
        gridLayoutSelected: id,
      };

      updatedConfiguration(updateActive);
    },
    [active],
  );

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
          width: data.static ? '95%' : '100%',
        }}
      >
        {(hovered || data.static || data.isEditing) && (
          <Group
            pos="absolute"
            right={data.static || data.isEditing ? 5 : 1}
            top={5}
          >
            <Tooltip label="Inpect metadatas information">
              <ActionIcon
                variant="filled"
                aria-label="Metadatas"
                onClick={() => handleInspectMetadata(data.i)}
                className={classes.actionButton}
                // disabled={data.plot.some((item) => item.x.length === 0 && item.y.length === 0)}
              >
                <IconBrandDatabricks
                  style={{ width: '70%', height: '70%' }}
                  stroke={1.5}
                />
              </ActionIcon>
            </Tooltip>

            <Tooltip
              label={data.isEditing ? 'Stop editing the grid' : 'Edit the grid'}
            >
              <ActionIcon
                variant="filled"
                aria-label="Editing"
                onClick={() => handleEditGrid(data.i)}
                className={classes.actionButton}
                color={data.isEditing ? 'yellow' : 'green'}
              >
                {data.isEditing ? (
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

            {handleDragStatic && (
              <Tooltip
                label={
                  data.static
                    ? 'Zoom in/out the plot and stop dragging'
                    : 'Drag the plot'
                }
              >
                <ActionIcon
                  variant="filled"
                  aria-label="StaticLayout"
                  onClick={() => handleDragStatic(data.i)}
                  className={classes.actionButton}
                >
                  {data.static ? (
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
                  onClick={() => handleDeleteGrid(data.i)}
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
      <SimplePlotly
        data={data.plot}
        width={data.w * colWidth - 20}
        height={data.h * rowHeight + (23 * (data.h * rowHeight)) / 100}
        isStatic={data.static}
        title={data.title}
        xAxisName={data.xAxisName}
        yAxisName={data.yAxisName}
        y2AxisName={data?.y2AxisName}
      />
    </div>
  );
};
