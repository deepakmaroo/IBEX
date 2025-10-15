import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  Axis,
  Configuration,
  Coordinates,
  DataGridPlot,
  DataPlotly,
  GridLayoutPlotProps,
} from 'src/renderer/types';
import {
  ActionIcon,
  Container,
  Group,
  ScrollArea,
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
  getDefaultUri,
  getLastIndexedField,
  getVectorData,
  normalizeIndices,
  updateIndexFieldName,
} from '../../utils';
import { showNotification } from '@mantine/notifications';
import { MetaDataInfos } from '../../pages/visualization/VisualizationMetaData';

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
  const [metadataTabsValue, setMetadataTabsValue] = useState<string>(
    data.plot[0]?.name || '',
  );

  /**
   * updateslider coordinate value
   */
  const handleUpdateCoordinate = async (
    coordinate: Coordinates,
    valueIndex: number,
  ) => {
    // Check if the coordinate has a target
    const lastTargetLastName = getLastIndexedField(coordinate.target);
    if (!lastTargetLastName)
      return console.warn('No indexed field found in target');

    let updatedDimension: DataGridPlot;
    // Update plot with new selected dimension
    if (coordinate?.isDimensionCoordinate) {
      // Get dataGrid to update
      updatedDimension = JSON.parse(JSON.stringify(data));

      for (const plot of updatedDimension.plot) {
        const normalizedUri = normalizeIndices(plot.nodeUri); //Use normalized URI to get all matrix
        const newUri = normalizedUri.replace(
          `${coordinate.name}[:]`,
          `${coordinate.name}[${valueIndex}]`,
        );
        const newRes = await fetchDataPlot(newUri);

        // Add information indicating that this coordinate is used to select the dimension
        newRes.data.coordinates.find(
          (coord) => coord.name === coordinate.name,
        ).isDimensionCoordinate = true;

        // Update coordinates with data received from BE (new selected dimension)
        let resettedAxeIndex = 0;
        for (const coordinate of updatedDimension.coordinates) {
          const newCoord = newRes.data.coordinates.find(
            (newCoord) =>
              normalizeIndices(newRes.data.path) ===
                normalizeIndices(plot.path) &&
              normalizeIndices(newCoord.path) ===
                normalizeIndices(coordinate.path),
          );

          // reset axe index of each coordinate to reset sliders after calling BE
          coordinate.axeIndex = resettedAxeIndex;

          // Update coordinates with getting data from BE (update to new dimension)
          coordinate.shape = newCoord.shape;
          coordinate.coordinates = newCoord.coordinates;
          coordinate.data = newCoord.value;
          coordinate.valueIndex = 0;
          resettedAxeIndex++;
        }

        // Update plots
        plot.path = newRes.data.path;
        plot.shape = newRes.data.shape as number[];
        plot.yData = newRes.data.value;

        // Update xAxisData
        const xAxis = updatedDimension.coordinates.find(
          (coord) => coord.axeIndex === 0,
        );
        updatedDimension.xAxisData.name = xAxis.name;
        updatedDimension.xAxisData.path = getDefaultUri(
          newRes.data.coordinates[0].path,
        );
        updatedDimension.xAxisData.unit = xAxis.unit;
      }
    }

    if (updatedDimension) {
      data = updatedDimension;
    }

    // Update coordinates targets & paths with new valueIndex
    const updatedCoordinatesValue = data.coordinates.map((item) => {
      const lastTargetLastName = getLastIndexedField(coordinate.target);

      const updatedPath = updateIndexFieldName(
        item.path,
        lastTargetLastName,
        valueIndex,
      );
      const updatedTarget = updateIndexFieldName(
        item.target,
        lastTargetLastName,
        valueIndex,
      );

      return {
        ...item,
        path: updatedPath,
        target: updatedTarget,
        valueIndex:
          item.name === coordinate.name ? valueIndex : item.valueIndex,
      };
    });

    const updatedActive: Configuration = {
      ...active,
      dataPlot: active.dataPlot.map((item: DataGridPlot) => {
        if (item.i === data.i) {
          const updatedXAxisData: Axis = {
            ...data.xAxisData,
            path: updateIndexFieldName(
              data.xAxisData?.path || '',
              lastTargetLastName,
              valueIndex,
            ),
          };

          // Get x values switch x dependances
          const newXData = getArrayValueFromDependance(
            updatedCoordinatesValue,
            0,
          );

          const updatedPlot = data.plot.map((plotItem) => {
            const updatedNodeUri = updateIndexFieldName(
              plotItem.nodeUri,
              lastTargetLastName,
              valueIndex,
            );

            const updatedPath = updateIndexFieldName(
              plotItem.path || '',
              lastTargetLastName,
              valueIndex,
            );

            const newYData = getVectorData(
              updatedCoordinatesValue,
              plotItem.yData,
            );

            return {
              ...plotItem,
              x: newXData,
              y: newYData,
              nodeUri: updatedNodeUri,

              path: updatedPath,
            };
          });

          return {
            ...data,
            coordinates: updatedCoordinatesValue,
            plot: updatedPlot,
            xAxisData: updatedXAxisData,
          };
        }

        return item;
      }) as DataGridPlot[],
    };
    
    updatedConfiguration(updatedActive);
  };

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

    // Update metadataTabsValue for metadata when removing selected tab
    if (
      !data.plot.find((plot: DataPlotly) => plot.name === metadataTabsValue)
    ) {
      setMetadataTabsValue(data.plot[0]?.name);
    }
  }, [data.plot]);

  useEffect(() => {
    // Update downsampled method after a timeout
    if (data.downsampled_method) {
      setDownsamplingMethod(data.downsampled_method);
    }
  }, [data.downsampled_method]);

  useEffect(() => {
    const getDataPlotDownsampled = async () => {
      try {
        const updatedDataPlotList: DataGridPlot[] = JSON.parse(
          JSON.stringify(active.dataPlot),
        );
        const updatedDataPlot = updatedDataPlotList.find(
          (dataPlotToUpdate) => dataPlotToUpdate.i === data.i,
        );

        let plotIndex = 0;
        for (const plot of updatedDataPlot.plot) {
          const dataPlotDownsampled = await fetchDataPlot(
            plot.nodeUri.replace(/\[\d+\]/g, '[:]'),
            downsamplingMethod,
          );

          // Update coordinates with downsampled data only once because each plots have same coordinates
          if (plotIndex === 0) {
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

            // Update downsampled method
            updatedDataPlot.downsampled_method =
              dataPlotDownsampled.data.downsampled_method;
          }

          // Update plot with downsampled data
          plot.shape = dataPlotDownsampled.data.downsampled_shape;
          // Get x axis switch coordinates dependances
          plot.x = getArrayValueFromDependance(updatedDataPlot.coordinates, 0);
          plot.yData = dataPlotDownsampled.data.value;
          // Get y axis
          const vectorData = getVectorData(
            updatedDataPlot.coordinates,
            plot.yData,
          );
          plot.y = vectorData;

          plotIndex++;
        }

        // Save new configuration with sampled data
        const updatedActive = {
          ...active,
          dataPlot: updatedDataPlotList,
        };
        updatedConfiguration(updatedActive);
      } catch (error) {
        console.error('Error getting downsampled data: ', error);
        showNotification({
          title: 'Error',
          message: `Unable to get downsampled data.`,
          color: 'red',
        });
      }
    };

    if (downsamplingMethod) {
      getDataPlotDownsampled();
    }
  }, [downsamplingMethod]);

  useLayoutEffect(() => {
    setIs3DView(data.coordinates.length >= 3);
  }, []);

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

  const heatmapLogo = (
    <svg width="50" height="50" viewBox="0 0 50 50">
      <rect x="0" y="0" width="15" height="15" fill="#440154" />
      <rect x="17" y="0" width="15" height="15" fill="#31688e" />
      <rect x="34" y="0" width="15" height="15" fill="#35b779" />

      <rect x="0" y="17" width="15" height="15" fill="#fde725" />
      <rect x="17" y="17" width="15" height="15" fill="#440154" />
      <rect x="34" y="17" width="15" height="15" fill="#31688e" />

      <rect x="0" y="34" width="15" height="15" fill="#35b779" />
      <rect x="17" y="34" width="15" height="15" fill="#fde725" />
      <rect x="34" y="34" width="15" height="15" fill="#440154" />
    </svg>
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
              {data.coordinates.length && ( // Don't show downsampled methods when showing by default metadata
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
              )}
              {/* 3D button display */}
              {data.coordinates.length >= 3 && ( //Only show if there are 3 or more coordinates - corresponding to 3D data
                <Tooltip label="Toggle 1D/Heatmap view">
                  <ActionIcon
                    variant="filled"
                    aria-label="Toggle 1D/Heatmap view"
                    onClick={() => setIs3DView((prev) => !prev)}
                    className={classes.actionButton}
                  >
                    {is3DView ? <Text fw="bold">1D</Text> : heatmapLogo}
                  </ActionIcon>
                </Tooltip>
              )}
              {/* Metadata component button */}
              {data.coordinates.length && ( // Don't show metadata button when showing by default metadata
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
              )}
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

      {!data.coordinates.length ? (
        <Container pt="40px" p="1rem">
          <Tabs
            value={metadataTabsValue}
            onChange={(value) => setMetadataTabsValue(value)}
          >
            <ScrollArea
              key={`tabScrollBar_${active.checkedNodeURI.length}`}
              type="hover"
              scrollHideDelay={0} // keep visible scrollbar only during hover
              scrollbarSize={6}
              offsetScrollbars
              style={{ maxWidth: '100%' }}
            >
              <Tabs.List
                style={{
                  flexWrap: 'nowrap',
                  whiteSpace: 'nowrap',
                }}
              >
                {data.plot.length > 0 &&
                  data.plot.map((item: DataPlotly, index) => (
                    <Tabs.Tab
                      key={`metadata_${index}`}
                      value={item.name}
                      disabled={
                        !data.isEditing && metadataTabsValue !== item.name
                      }
                    >
                      {item.name}
                    </Tabs.Tab>
                  ))}
              </Tabs.List>
            </ScrollArea>

            {data &&
              data.plot.map((plot: DataPlotly, index) => {
                return (
                  <Tabs.Panel key={`metadata_${index}`} value={plot.name}>
                    <MetaDataInfos
                      gridLayoutKey={data.i}
                      data={plot}
                      yAxis={
                        plot.yaxis !== '' ? data.y2AxisData : data.yAxisData
                      }
                      height={(heightGrid - 56).toString()} // 56px is equivalent to paddings (40px from top + 1rem from bottom)
                      tabsSelected={plot.name}
                    />
                  </Tabs.Panel>
                );
              })}
          </Tabs>
        </Container>
      ) : is3DView ? (
        <Surface2D
          itemDataGrid={data}
          width={
            data.coordinates.length > 0
              ? widthGrid - widthSlider - 30
              : widthGrid - 40
          }
          height={heightGrid - 10}
          plotIndex={active3DTab}
          handleUpdateCoordinate={handleUpdateCoordinate}
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
          handleUpdateCoordinate={handleUpdateCoordinate}
        />
      )}
    </Container>
  );
};
