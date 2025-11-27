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
  URITreeNodeData,
} from 'src/renderer/types';
import { Center, Container, ScrollArea, Tabs, Text } from '@mantine/core';
import { SimplePlotly, Surface2D } from '../plot';
import { useIbexStore } from '../../stores';
import {
  fetchDataPlot,
  getArrayValueFromDependance,
  getErrorYVectors,
  getLastIndexedField,
  getVectorData,
  limitSlidersToMaxLength,
  normalizeIndices,
  updateIndexFieldName,
} from '../../utils';
import { showNotification } from '@mantine/notifications';
import { MetaDataInfos } from '../../pages/visualization/VisualizationMetaData';
import { HoverButtons } from './HoverButtons';

export const GridLayoutPlot = ({
  data,
  colWidth,
  rowHeight,
  downsamplingList,
}: GridLayoutPlotProps) => {
  const { active, updatedConfiguration } = useIbexStore();
  const gridSliderRef = useRef<HTMLDivElement>(null);
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
    data.plot[0]?.path || '',
  );
  const [shouldDisplayMetadata, setShouldDisplayMetadata] = useState(false);

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
    }) as Coordinates[];

    limitSlidersToMaxLength(updatedCoordinatesValue);

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

            if (plotItem?.error_bands?.length) {
              const updated_error_y = getErrorYVectors(
                plotItem,
                updatedCoordinatesValue,
              );
              return {
                ...plotItem,
                x: newXData,
                y: newYData,
                error_y: updated_error_y,
                nodeUri: updatedNodeUri,
                path: updatedPath,
              };
            } else {
              return {
                ...plotItem,
                x: newXData,
                y: newYData,
                nodeUri: updatedNodeUri,
                path: updatedPath,
              };
            }
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

  useEffect(() => {
    // Rule to force to show metadata when y data is of type string
    let isYDataString = false;
    for (const plot of data.plot) {
      const typeOfYData = typeof plot.y[0];
      if (typeOfYData === 'string') {
        isYDataString = true;
      }
    }
    setShouldDisplayMetadata(isYDataString);
  }, [data.plot.length]);

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
      !data.plot.find((plot: DataPlotly) => plot.path === metadataTabsValue)
    ) {
      setMetadataTabsValue(data.plot[0]?.path);
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
   * Handle the delete grid event
   */
  const handleDeleteGrid = useCallback((id: string) => {
    const { active, updatedConfiguration } = useIbexStore.getState();
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
  }, []);

  /**
   * Handle edit grid event
   */
  const handleEditGrid = useCallback((id: string) => {
    const { active, updatedConfiguration } = useIbexStore.getState();

    const findPlot = active.dataPlot.find((item) => item.i === id);
    if (!findPlot) return;

    const updatedDataPlot = active.dataPlot.map((item) =>
      item.i === id
        ? { ...item, isEditing: !item.isEditing, static: !item.isEditing }
        : { ...item, isEditing: false, static: false },
    );

    // Check from tree selected plots (all plots used in dataGrid)
    const checkedNodeURI: URITreeNodeData[] = !findPlot.isEditing
      ? findPlot.plot.map((item) => ({
          uri: normalizeIndices(item.nodeUri),
          name: item.labelUri,
        }))
      : [];

    if (checkedNodeURI.length) {
      for (const plot of findPlot.plot) {
        if (!plot.error_bands) {
          continue;
        }
        for (const error_band of plot.error_bands) {
          // Check from tree selected error bands to plot
          checkedNodeURI.push({
            name: plot.labelUri,
            uri: normalizeIndices(error_band.path),
          });
        }
      }
    }

    const updatedActive: Configuration = {
      ...active,
      saved: false,
      dataPlot: updatedDataPlot,
      checkedNodeURI: checkedNodeURI,
    };

    updatedConfiguration(updatedActive);
  }, []);

  /**
   * Inspect metadata of plot
   */
  const handleInspectMetadata = useCallback(
    (id: string) => {
      const updatedDataPlot: DataGridPlot[] = JSON.parse(
        JSON.stringify(active.dataPlot),
      );
      updatedDataPlot.find((dataPlot) => dataPlot.i === id).isEditing = false;

      const updatedActive: Configuration = {
        ...active,
        gridLayoutSelected: id,
        dataPlot: updatedDataPlot,
      };
      updatedConfiguration(updatedActive);
    },
    [active],
  );

  return (
    <Container fluid w={widthGrid} p={0}>
      {active.dataURI.length > 0 && (
        <HoverButtons
          data={data}
          downsamplingMethod={downsamplingMethod}
          downsamplingList={downsamplingList}
          shouldDisplayMetadata={shouldDisplayMetadata}
          setDownsamplingMethod={setDownsamplingMethod}
          handleEditGrid={handleEditGrid}
          handleInspectMetadata={handleInspectMetadata}
          handleDeleteGrid={handleDeleteGrid}
          is3DView={is3DView}
          setIs3DView={setIs3DView}
          active3DTab={active3DTab}
          setActive3DTab={setActive3DTab}
        />
      )}

      {!(active.dataURI.length > 0) ? (
        // Control when loading a template without selecting URIs
        <Center h={heightGrid}>
          <Text>Current configuration has no data. Please, select URIs.</Text>
        </Center>
      ) : !data.coordinates.length || shouldDisplayMetadata ? (
        // Show metadata when not enough coordinates to plot
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
                      value={item.path}
                      disabled={
                        !data.isEditing && metadataTabsValue !== item.path
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
                  <Tabs.Panel key={`metadata_${index}`} value={plot.path}>
                    <MetaDataInfos
                      gridLayoutKey={data.i}
                      data={plot}
                      yAxis={
                        plot.yaxis !== '' ? data.y2AxisData : data.yAxisData
                      }
                      height={(heightGrid - 56).toString()} // 56px is equivalent to paddings (40px from top + 1rem from bottom)
                      tabsSelected={plot.path}
                    />
                  </Tabs.Panel>
                );
              })}
          </Tabs>
        </Container>
      ) : is3DView ? (
        // Show heatmap
        <Surface2D
          itemDataGrid={data}
          width={widthGrid}
          height={heightGrid - 10}
          plotIndex={active3DTab}
          handleUpdateCoordinate={handleUpdateCoordinate}
        />
      ) : (
        // Show simple plot
        <SimplePlotly
          itemDataGrid={data}
          width={widthGrid}
          height={heightGrid}
          sliderRef={gridSliderRef}
          is3DView={is3DView}
          handleUpdateCoordinate={handleUpdateCoordinate}
        />
      )}
    </Container>
  );
};
