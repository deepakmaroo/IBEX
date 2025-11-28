import classes from './HoverButtons.module.css';
import React, { useCallback, useEffect } from 'react';
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
import { Configuration, DataGridPlot } from '../../types';
import { fetchErrorBandsInConfig } from '../../utils';
import { useIbexStore } from '../../stores';

interface HoverButtonsProps {
  data: DataGridPlot;
  downsamplingMethod: string;
  downsamplingList: string[];
  shouldDisplayMetadata: boolean;
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
    shouldDisplayMetadata,
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

    const updateDisplayErrorBands = useCallback(
      (newValue: boolean) => {
        const updatedActive = JSON.parse(
          JSON.stringify(active),
        ) as Configuration;
        const selectedDataPlot = updatedActive.dataPlot.find(
          (dataPlot) => dataPlot.i === data.i,
        );
        selectedDataPlot.displayErrorBand = newValue;
        updatedConfiguration(updatedActive);
      },
      [active],
    );

    const removeErrorBands = useCallback(
      (active: Configuration) => {
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
      },
      [active],
    );

    useEffect(() => {
      const updateErrorBands = async () => {
        const updatedActive = JSON.parse(
          JSON.stringify(active),
        ) as Configuration;
        if (data.displayErrorBand) {
          // Get all error bands from selected dataPLot
          const selectedDataPlot = updatedActive.dataPlot.find(
            (dataPlot) => dataPlot.i === data.i,
          );
          for (const plot of selectedDataPlot.plot) {
            await fetchErrorBandsInConfig(updatedActive, plot.nodeUri);
          }
        } else {
          // Removes all error bands from selected dataPlot
          removeErrorBands(updatedActive);
        }
        // Update config
        updatedConfiguration(updatedActive);
      };

      // Triggerred when update "Error bands" switch
      updateErrorBands();
    }, [data.displayErrorBand]);

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
              {data.coordinates.length && !shouldDisplayMetadata && (
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

              {!is3DView && data.isEditing && !shouldDisplayMetadata && (
                <Switch
                  label="Error bands"
                  checked={data.displayErrorBand}
                  onChange={(event) =>
                    updateDisplayErrorBands(event.currentTarget.checked)
                  }
                />
              )}

              {data.coordinates.length >= 3 && !shouldDisplayMetadata && (
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

              {data.coordinates.length && !shouldDisplayMetadata && (
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
