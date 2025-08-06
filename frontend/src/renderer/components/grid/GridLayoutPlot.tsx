import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  Configuration,
  DataGridPlot,
  GridLayoutPlotProps,
} from 'src/renderer/types';
import { ActionIcon, Container, Group, Text, Tooltip } from '@mantine/core';

import {
  IconBrandDatabricks,
  IconCheck,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react';
import { useHover } from '@mantine/hooks';
import classes from './GridLayoutPlot.module.css';
import { SimplePlotly, Surface2D } from '../plot';
import { useIbexStore } from '../../stores';
import { normalizeIndices } from '../../utils';

export const GridLayoutPlot = ({
  data,
  colWidth,
  rowHeight,
}: GridLayoutPlotProps) => {
  const { active, updatedConfiguration } = useIbexStore();
  const gridSliderRef = useRef<HTMLDivElement>(null);

  const { hovered, ref: hoverRef } = useHover();
  const [widthSlider, setWidthSlider] = useState<number>(0);
  const [heightGrid, setHeightGrid] = useState(
    data.h * rowHeight + (23 * (data.h * rowHeight)) / 100,
  );
  const [widthGrid, setWidthGrid] = useState(Math.floor(data.w * colWidth));
  const [is3DView, setIs3DView] = useState<boolean>(false);

  /**
   * Handle resize the grid
   */
  useEffect(() => {
    setHeightGrid(data.h * rowHeight + (23 * (data.h * rowHeight)) / 100);
    setWidthGrid(Math.floor(data.w * colWidth));
  }, [data.h, rowHeight, data.w, colWidth]);

  /**
   * Update the width of the slider when the grid is resized
   */
  useLayoutEffect(() => {
    if (gridSliderRef.current) {
      setWidthSlider(gridSliderRef.current.offsetWidth);
    }
  }, [gridSliderRef.current?.offsetWidth]);

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
          ? { ...item, isEditing: !item.isEditing, static: !item.isEditing }
          : { ...item, isEditing: false, static: false },
      );

      const updatedActive: Configuration = {
        ...active,
        saved: false,
        dataPlot: updatedDataPlot,
        checkedNodeURI: !findPlot.isEditing
          ? findPlot.plot.map((item) => ({
              uri: normalizeIndices(item.nodeUri),
              name: item.labelUri,
            }))
          : [],
      };

      updatedConfiguration(updatedActive);
    },
    [active],
  );

  /**
   * Inspect metadata of plot
   */
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
    <Container fluid w={widthGrid} p={0}>
      <div ref={hoverRef} className={classes.containerButton}>
        {(hovered || data.isEditing) && (
          <Group pos="absolute" right={data.isEditing ? 3 : 1} top={5} grow>
            {/* 3D button display */}
            <Tooltip label="Toggle 2D/3D view">
              <ActionIcon
                variant="filled"
                aria-label="Toggle 2D/3D view"
                onClick={() => setIs3DView((prev) => !prev)}
                className={classes.actionButton}
                disabled={data.coordinates.length !== 3} //Only enable if there are 3 coordinates - corresponding to 3D data
              >
                {is3DView ? (
                  <Text fw="bold">1D</Text>
                ) : (
                  <Text fw="bold">3D</Text>
                )}
              </ActionIcon>
            </Tooltip>
            {/* Metadata component button */}
            <Tooltip label="Inspect metadatas information">
              <ActionIcon
                variant="filled"
                aria-label="Metadatas"
                onClick={() => handleInspectMetadata(data.i)}
                className={classes.actionButton}
              >
                <IconBrandDatabricks
                  style={{ width: '70%', height: '70%' }}
                  stroke={1.5}
                />
              </ActionIcon>
            </Tooltip>
            <Tooltip
              label={
                data.isEditing
                  ? 'Validate/Close editing the grid'
                  : 'Open editing the grid'
              }
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
            {/* Delete grid button */}
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

      {is3DView ? (
        <Surface2D
          itemDataGrid={data}
          width={
            data.coordinates.length > 0
              ? widthGrid - widthSlider - 30
              : widthGrid - 40
          }
          height={heightGrid}
        />
      ) : (
        <SimplePlotly
          itemDataGrid={data}
          width={
            data.coordinates.length > 0
              ? widthGrid - widthSlider - 30
              : widthGrid - 40
          }
          height={heightGrid}
          sliderRef={gridSliderRef}
          is3DView={is3DView}
        />
      )}
    </Container>
  );
};
