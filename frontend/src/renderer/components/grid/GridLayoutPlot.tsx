import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  Configuration,
  Coordinates,
  DataGridPlot,
  GridLayoutPlotProps,
} from 'src/renderer/types';
import { ActionIcon, Container, Grid, Group, Tooltip } from '@mantine/core';

import {
  IconBrandDatabricks,
  IconCheck,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react';
import { useHover } from '@mantine/hooks';
import classes from './GridLayoutPlot.module.css';
import { SimplePlotly } from '../plot';
import { useIbexStore } from '../../stores';
import { VerticalSlider } from '../verticalSlider';
import {
  fetchVectorData,
  getLastIndexedField,
  normalizeIndices,
  updateIndexFieldName,
} from '../../utils';

export const GridLayoutPlot = ({
  data,
  colWidth,
  rowHeight,
}: GridLayoutPlotProps) => {
  const { active, updatedConfiguration } = useIbexStore();
  const { hovered, ref: hoverRef } = useHover();

  const gridSliderRef = useRef<HTMLDivElement>(null);
  const [widthSlider, setWidthSlider] = useState<number>(0);

  const [heightGrid, setHeightGrid] = useState(
    data.h * rowHeight + (23 * (data.h * rowHeight)) / 100,
  );
  const [widthGrid, setWidthGrid] = useState(Math.floor(data.w * colWidth));

  useLayoutEffect(() => {
    if (gridSliderRef.current) {
      setWidthSlider(gridSliderRef.current.offsetWidth);
    }
  }, [gridSliderRef.current?.offsetWidth]);

  /**
   * Handle resize the grid
   */
  useEffect(() => {
    setHeightGrid(data.h * rowHeight + (23 * (data.h * rowHeight)) / 100);
    setWidthGrid(Math.floor(data.w * colWidth));
  }, [data.h, rowHeight, data.w, colWidth]);

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

  /**
   * updateslider coordinate value
   */
  const handleUpdateCoordinate = async (
    coordinate: Coordinates,
    index: number,
  ) => {
    // Check if the coordinate has a target
    const lastTargetLastName = getLastIndexedField(coordinate.target);
    if (!lastTargetLastName)
      return console.warn('No indexed field found in target');

    const updatedCoordinatesValue = data.coordinates.map((item) => {
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
      dataPlot: await Promise.all(
        active.dataPlot.map(async (item) => {
          if (item.i === data.i) {
            const updatedPlot = await Promise.all(
              item.plot.map(async (plotItem) => {
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

                const responseYData = await fetchVectorData(updatedNodeUri, item.coordinates, plotItem);

                return {
                  ...plotItem,
                  y: responseYData,
                  nodeUri: updatedNodeUri,
                  path: updatedPath,
                };
              }),
            );

            return {
              ...item,
              coordinates: updatedCoordinatesValue,
              plot: updatedPlot,
            };
          }

          return item;
        }),
      ),
    };

    updatedConfiguration(updatedActive);
  };

  return (
    <Container fluid w={widthGrid} p={0}>
      <Grid
        styles={{
          inner: {
            margin: 0,
            width: 'inherit',
          },
        }}
      >
        {data.coordinates.length > 0 && (
          <Grid.Col span={2} ref={gridSliderRef}>
            <Group justify="space-between" gap="0">
              {data.coordinates.map((item, index) => (
                <VerticalSlider
                  key={index}
                  name={item.name}
                  index={item.index || 0}
                  data={item.data}
                  getValue={(index) => {
                    handleUpdateCoordinate(item, index);
                  }}
                  height={heightGrid - 80}
                  disabled={!data.isEditing}
                />
              ))}
            </Group>
          </Grid.Col>
        )}
        <Grid.Col
          span={data.coordinates.length > 0 ? 10 : 12}
          pos="relative"
          w="100%"
          h="100%"
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            ref={hoverRef}
            className={classes.containerButton}
            style={{
              width: data.isEditing ? '95%' : '100%',
            }}
          >
            {(hovered || data.isEditing) && (
              <Group pos="absolute" right={data.isEditing ? 3 : 1} top={5} grow>
                <Tooltip label="Inspect metadatas information">
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
            width={
              data.coordinates.length > 0
                ? widthGrid - widthSlider - 30
                : widthGrid - 40
            }
            height={heightGrid}
            isStatic={data.isEditing}
            title={data.title}
            xAxis={data.xAxisData}
            yAxis={data.yAxisData}
            y2Axis={data?.y2AxisData}
          />
        </Grid.Col>
      </Grid>
    </Container>
  );
};
