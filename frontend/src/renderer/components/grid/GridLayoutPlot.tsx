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
  DataPlotly,
  GridLayoutPlotProps,
} from 'src/renderer/types';
import { ActionIcon, Container, Grid, Group, Tooltip } from '@mantine/core';

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
import { VerticalSlider } from '../verticalSlider';
import { fetchFieldValue } from '../../utils';

function getLastIndexedField(target: string): string | null {
  const matches = [...target.matchAll(/([a-zA-Z0-9_]+)\[\d+\]/g)];
  if (matches.length === 0) return null;
  return matches[matches.length - 1][1]; // Le dernier nom capturé
}

type UriUpdated = {
  target: string;
  uri: string;
};
function updateUriAndTarget(
  target: string,
  uri: string,
  fieldName: string, // ex: "ion" ou "profiles_1d"
  value: number,
): UriUpdated {
  const regex = new RegExp(`(${fieldName})\\[(\\d+)\\]`);

  const newTarget = target.replace(regex, `${fieldName}[${value}]`);
  const newUri = uri.replace(regex, `${fieldName}[${value}]`);

  return {
    target: newTarget,
    uri: newUri,
  };
}

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
          : findPlot.plot.map((item) => ({
              uri: item.nodeUri,
              name: item.labelUri,
            })),
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

  const handleUpdateSliderValue = async (
    coordinate: Coordinates,
    value: number,
    index: number,
  ) => {
    const lastTargetLastName = getLastIndexedField(coordinate.target);
    const newUri = updateUriAndTarget(
      coordinate.target,
      coordinate.nodeUri,
      lastTargetLastName,
      index,
    ).uri;

    const updatedCoordinatesValue = data.coordinates.map((item) => {
      const lastTargetLastName = getLastIndexedField(coordinate.target);

      const updated = updateUriAndTarget(
        item.target,
        newUri,
        lastTargetLastName,
        index,
      );

      return {
        ...item,
        nodeUri: newUri, // unifié pour toutes les coordonnées
        target: updated.target, // met à jour seulement si l'item.target contient un indice
        value: item.name === coordinate.name ? value : item.value,
      };
    });
    const responseYData = await fetchFieldValue(newUri);

    const updatedActive = {
      ...active,
      dataPlot: active.dataPlot.map((item) => {
        if (item.i === data.i) {
          return {
            ...item,
            coordinates: updatedCoordinatesValue,
            plot: item.plot.map((plotItem): DataPlotly => {
              if (plotItem.nodeUri === coordinate.nodeUri) {
                return {
                  ...plotItem,
                  y: responseYData.value as number[],
                  nodeUri: newUri,
                };
              }
              return plotItem;
            }),
          };
        }
        return item;
      }),
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
            <Group justify="space-between" gap="xs">
              {data.coordinates.map((item, index) => (
                <VerticalSlider
                  key={index}
                  name={item.name}
                  value={item.value}
                  data={item.data}
                  getValue={(value, index) => {
                    handleUpdateSliderValue(item, value, index);
                  }}
                  height={heightGrid - 80}
                  disabled={!data.isEditing || !data.static}
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
              width: data.static ? '95%' : '100%',
            }}
          >
            {(hovered || data.static || data.isEditing) && (
              <Group
                pos="absolute"
                right={data.static || data.isEditing ? 3 : 1}
                top={5}
                grow
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
                  label={
                    data.isEditing ? 'Stop editing the grid' : 'Edit the grid'
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

                {handleDragStatic && (
                  <Tooltip
                    label={
                      data.static
                        ? 'Drag the plot'
                        : 'Zoom in/out the plot and stop dragging'
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
            width={
              data.coordinates.length > 0
                ? widthGrid - widthSlider - 30
                : widthGrid - 40
            }
            height={heightGrid}
            isStatic={data.static}
            title={data.title}
            xAxis={data.xAxis}
            yAxis={data.yAxis}
            y2Axis={data?.y2Axis}
          />
        </Grid.Col>
      </Grid>
    </Container>
  );
};
