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
import {
  ActionIcon,
  Container,
  Group,
  Select,
  Tabs,
  Text,
  Tooltip,
} from '@mantine/core';

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
import {
  fetchDataPlot,
  getArrayValueFromDependance,
  getVectorData,
  normalizeIndices,
} from '../../utils';

export const GridLayoutPlot = ({
  data,
  colWidth,
  rowHeight,
  downsamplingList,
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
  const [active3DTab, setActive3DTab] = useState<string>('0');
  const [downsamplingMethod, setDownsamplingMethod] = useState<string | null>(
    null,
  );
  /**
   * Handle resize the grid
   */
  useEffect(() => {
    setHeightGrid(data.h * rowHeight + (23 * (data.h * rowHeight)) / 100);
    setWidthGrid(Math.floor(data.w * colWidth));
  }, [data.h, rowHeight, data.w, colWidth]);

  useEffect(() => {
    if (parseInt(active3DTab) > data.plot.length - 1) {
      setActive3DTab('0');
    }
  }, [data.plot]);

  useEffect(() => {
    const getDataPlotDownsampled = async () => {
      const dataPlotDownsampled = await fetchDataPlot(
        data.plot[0].nodeUri.replace(/\[\d+\]/g, '[:]'),
        downsamplingMethod,
      );
      const updatedDataPlotList: DataGridPlot[] = JSON.parse(
        JSON.stringify(active.dataPlot),
      );
      const updatedDataPlot = updatedDataPlotList.find(
        (dataPlotToUpdate) => dataPlotToUpdate.i === data.i,
      );

      // Update coordinates with downsampled data
      let coordinateIndex = 0;
      for (const coordinate of updatedDataPlot.coordinates) {
        coordinate.downsampled_shape =
          dataPlotDownsampled.data.coordinates[
            coordinateIndex
          ].downsampled_shape;
        coordinate.data =
          dataPlotDownsampled.data.coordinates[coordinateIndex].value;
        coordinateIndex++;
      }

      // Update plot with downsampled data
      for (const plot of updatedDataPlot.plot) {
        plot.shape = dataPlotDownsampled.data.downsampled_shape;
        // Get x axis switch coordinates dependances
        plot.x = getArrayValueFromDependance(updatedDataPlot.coordinates);
        plot.yData = dataPlotDownsampled.data.value;
        // Get y axis
        const vectorData = getVectorData(
          updatedDataPlot.coordinates,
          plot.yData,
        );
        plot.y = vectorData;
      }

      // Save new configuration with sampled data
      const updatedActive = {
        ...active,
        dataPlot: updatedDataPlotList,
      };
      updatedConfiguration(updatedActive);
    };

    if (downsamplingMethod) {
      getDataPlotDownsampled();
    }
  }, [downsamplingMethod]);

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
        <Group justify="space-between" h={'100%'}>
          {is3DView ? (
            <Tabs
              value={active3DTab}
              onChange={(value) => setActive3DTab(value)}
            >
              <Tabs.List>
                {data.plot.map((plot, index) => (
                  <Tabs.Tab key={`3D_tab_${index}`} value={index.toString()}>
                    {plot.name}
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs>
          ) : (
            <div></div>
          )}

          {hovered || data.isEditing ? (
            <Group pos="absolute" right={'1rem'} top={5}>
              <Tooltip label="Select your downsampling method">
                <Select
                  value={downsamplingMethod || 'None'}
                  w="7rem"
                  size="xs"
                  disabled={!data.isEditing}
                  data={downsamplingList}
                  onChange={setDownsamplingMethod}
                  placeholder="Downsampling"
                ></Select>
              </Tooltip>
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
                    <Text fw="bold">2D</Text>
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
          ) : (
            <div></div>
          )}
        </Group>
      </div>

      {is3DView ? (
        <Surface2D
          itemDataGrid={data}
          width={
            data.coordinates.length > 0
              ? widthGrid - widthSlider - 30
              : widthGrid - 40
          }
          height={heightGrid - 10}
          plotIndex={active3DTab}
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
