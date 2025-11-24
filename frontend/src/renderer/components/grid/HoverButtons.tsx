import classes from './HoverButtons.module.css';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Group,
  Tooltip,
  ActionIcon,
  Select,
  Text,
  Tabs,
  Switch,
} from '@mantine/core';
import {
  IconBrandDatabricks,
  IconCheck,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react';
import { useHover } from '@mantine/hooks';
import {
  AxisData,
  DataGridPlot,
  DataPlotly,
  URITreeNodeData,
} from '../../types';
import {
  fetchFieldValue,
  getVectorData,
  normalizeIndices,
  removeSuffix,
} from '../../utils';
import { useIbexStore } from '../../stores';

interface HoverButtonsProps {
  data: DataGridPlot;
  downsamplingMethod: string;
  downsamplingList: string[];
  setDownsamplingMethod: React.Dispatch<React.SetStateAction<string>>;
  handleEditGrid: (id: string) => void;
  handleInspectMetadata: (id: string) => void;
  handleDeleteGrid: (id: string) => void;
  is3DView: boolean;
  setIs3DView: React.Dispatch<React.SetStateAction<boolean>>;
  active3DTab: string;
  setActive3DTab: React.Dispatch<React.SetStateAction<string>>;
}

export const HoverButtons = React.memo(
  ({
    data,
    downsamplingMethod,
    downsamplingList,
    setDownsamplingMethod,
    handleEditGrid,
    handleInspectMetadata,
    handleDeleteGrid,
    is3DView,
    setIs3DView,
    active3DTab,
    setActive3DTab,
  }: HoverButtonsProps) => {
    const { active, updatedConfiguration } = useIbexStore();
    const { hovered, ref: hoverRef } = useHover();
    const [shouldDisplayErrorBands, setShouldDisplayErrorBands] =
      useState(true);

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

    const formatErrorBands = (
      foundedPlot: DataPlotly,
      yValue: number[],
      yData: AxisData,
      nodeUri: string,
    ) => {
      if (
        !(nodeUri.endsWith('_error_lower') || nodeUri.endsWith('_error_upper'))
      ) {
        return;
      }

      // Change the plot format to show error bands
      let error_suffix = '';
      if (nodeUri.endsWith('_error_lower')) {
        error_suffix = '_error_lower';
      } else if (nodeUri.endsWith('_error_upper')) {
        error_suffix = '_error_upper';
      }
      const mainNodeUri = removeSuffix(nodeUri, error_suffix);

      if (foundedPlot && !foundedPlot?.error_bands) {
        // Init error_bands
        foundedPlot.error_bands = [];
      }

      if (!foundedPlot?.error_y) {
        // Init error_y
        foundedPlot.error_y = {
          type: 'data',
          symmetric: true,
          array: yValue,
        };
      }

      if (foundedPlot?.error_bands?.length) {
        // We are not in symectric case when there is more than one selected error band
        foundedPlot.error_y.symmetric = false;
      }

      if (
        error_suffix === '_error_lower' &&
        foundedPlot?.error_bands.find(
          (error_band) =>
            error_band.path === normalizeIndices(mainNodeUri) + '_error_upper',
        ) &&
        foundedPlot?.error_y?.type === 'data'
      ) {
        // Set to arrayminus when lower & other error_band
        foundedPlot.error_y.arrayminus = yValue;
      } else if (
        error_suffix === '_error_upper' &&
        foundedPlot?.error_bands.find(
          (error_band) =>
            error_band.path === normalizeIndices(mainNodeUri) + '_error_lower',
        ) &&
        foundedPlot?.error_y?.type === 'data'
      ) {
        // Set lower as arrayminus when select upper & having lower
        foundedPlot.error_y.arrayminus = foundedPlot.error_y.array;
        foundedPlot.error_y.array = yValue;
      }

      foundedPlot.error_bands = foundedPlot.error_bands.filter(
        (errors) => errors.path !== normalizeIndices(nodeUri),
      );
      // Update error_bands by adding the new selected one
      foundedPlot.error_bands.push({
        path: normalizeIndices(nodeUri),
        yData: yData,
      });

      // const currentPlot = Array.isArray(dataPlot.plot) ? dataPlot.plot : [];
      return foundedPlot;
    };

    const removeErrorBands = useCallback(() => {
      const selectedDataPlot = active.dataPlot.find(
        (dataPlot) => dataPlot.i === data.i,
      );
      for (const plot of selectedDataPlot.plot) {
        active.checkedNodeURI = active.checkedNodeURI.filter(
          (checkedNode) =>
            !plot?.error_bands
              ?.map((err) => err.path)
              ?.includes(checkedNode.uri),
        );
        delete plot?.error_bands;
        delete plot?.error_y;
      }
      updatedConfiguration(active);
    }, [active]);

    const handleErrorBands = useCallback(
      async (displayErrorBand: boolean) => {
        let havingUpper,
          havingLower = false;
        if (!displayErrorBand) {
          return;
        }

        const selectedDataPlot = active.dataPlot.find(
          (dataPlot) => dataPlot.i === data.i,
        );
        for (const plot of selectedDataPlot.plot) {
          try {
            // Get error bands
            const upperResponse = await fetchFieldValue(
              normalizeIndices(plot.nodeUri) + '_error_upper',
            );
            // const upperResponse = await fetchDataPlot(normalizeIndices(plot.nodeUri) + "_error_upper");
            havingUpper = true;
            const defaultUpperYValue = getVectorData(
              data.coordinates,
              upperResponse.value,
            );
            await formatErrorBands(
              plot,
              defaultUpperYValue,
              upperResponse.value,
              plot.nodeUri + '_error_upper',
            );

            const lowerResponse = await fetchFieldValue(
              normalizeIndices(plot.nodeUri) + '_error_lower',
            );
            havingLower = true;
            const defaultLowerYValue = getVectorData(
              data.coordinates,
              lowerResponse.value,
            );
            await formatErrorBands(
              plot,
              defaultLowerYValue,
              lowerResponse.value,
              plot.nodeUri + '_error_lower',
            );
          } catch (error) {
            console.error('Error handling error bands: ', error);

            if (!havingUpper) {
              // No error bands because upper doesn't exists
              continue;
            }

            if (havingUpper) {
              // Symmetric because lower doesn't exists
              continue;
            }
          } finally {
            if (havingUpper || havingLower) {
              const updatedPlot = active.dataPlot
                .find((dataPlot) => dataPlot.i === data.i)
                .plot.find(
                  (plotToUpdate) => plotToUpdate.nodeUri === plot.nodeUri,
                );
              const updatedCheckedNodeURI = JSON.parse(
                JSON.stringify(active.checkedNodeURI),
              ) as URITreeNodeData[];
              if (data.isEditing) {
                // Check error bands in tree
                for (const error_band of updatedPlot.error_bands) {
                  const newCheckedNode = {
                    name: updatedPlot.labelUri,
                    uri: normalizeIndices(error_band.path),
                  };
                  const exists = updatedCheckedNodeURI.some(
                    (node) =>
                      node.name === newCheckedNode.name &&
                      node.uri === newCheckedNode.uri,
                  );
                  if (!exists) {
                    updatedCheckedNodeURI.push(newCheckedNode);
                  }
                }
              }
              updatedConfiguration({
                ...active,
                checkedNodeURI: updatedCheckedNodeURI,
              });
            }
          }
        }
      },
      [active],
    );

    useEffect(() => {
      if (shouldDisplayErrorBands) {
        handleErrorBands(shouldDisplayErrorBands);
      } else {
        removeErrorBands();
      }
    }, [shouldDisplayErrorBands]);

    return (
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
              {data.coordinates.length && (
                <Tooltip label="Select your downsampling method">
                  <Select
                    value={downsamplingMethod || 'None'}
                    w="7rem"
                    size="xs"
                    disabled={!data.isEditing}
                    data={downsamplingList}
                    onChange={setDownsamplingMethod}
                    placeholder="Downsampling"
                  />
                </Tooltip>
              )}

              {!is3DView && data.isEditing && (
                <Switch
                  label="Error bands"
                  checked={shouldDisplayErrorBands}
                  onChange={(event) =>
                    setShouldDisplayErrorBands(event.currentTarget.checked)
                  }
                />
              )}

              {data.coordinates.length >= 3 && (
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

              {data.coordinates.length && (
                <Tooltip label="Inspect metadatas information">
                  <ActionIcon
                    variant="filled"
                    aria-label="Metadatas"
                    onClick={() => handleInspectMetadata(data.i)}
                    className={classes.actionButton}
                    // Disable when no names in plots (case when add template with bad URIs in first URIs selection)
                    disabled={
                      !(data.plot.filter((plot) => plot.name)?.length > 0)
                    }
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
            <div />
          )}
        </Group>
      </div>
    );
  },
);
