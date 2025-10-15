import { AppShell, Text } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import { useIbexStore } from '../stores';
import { useDisclosure } from '@mantine/hooks';
import {
  BaseCoordinates,
  BaseDataPlotly,
  ConfigForm,
  Configuration,
  ConfigurationToSave,
  Coordinates,
  DataGridPlot,
  DataGridPlotToSave,
  DataPlotly,
  URIData,
} from '../types';
import { ConfigCreateModal, ConfirmModal, Header } from '../components';
import { plotNodeUriLoaded, updateCustomDataTree } from '../utils';
import { VisualizationURIModal } from '../pages';
import { showNotification } from '@mantine/notifications';

export function MainLayout() {
  const {
    active,
    configurations,
    addConfiguration,
    removeConfiguration,
    updatedConfiguration,
    setActive,
  } = useIbexStore();

  const [
    isConfigCreateModalOpen,
    { open: openConfigCreateModal, close: closeConfigCreateModal },
  ] = useDisclosure(false);

  const [
    isConfigDeleteModalOpen,
    { open: openConfigDeleteModal, close: closeConfigDeleteModal },
  ] = useDisclosure(false);

  const [
    isAddTreeModalOpen,
    { open: openAddTreeModal, close: closeAddTreeModal },
  ] = useDisclosure(false);

  const handleAddConfiguration = (config: ConfigForm) => {
    const newConfig: Configuration = {
      name: config.name,
      dataURI: [],
      customDataTree: [],
      dataPlot: [],
      checkedNodeURI: [],
    };
    addConfiguration(newConfig);
    setActive(newConfig.name);
  };

  const handleRemoveConfiguration = () => {
    removeConfiguration(active?.name);
    closeConfigDeleteModal();
  };

  const handleSaveConfiguration = async () => {
    const dataGridWithoutData: DataGridPlotToSave[] = active.dataPlot.map(
      (dataGrid: DataGridPlot): DataGridPlotToSave => ({
        title: dataGrid.title,
        xAxisData: dataGrid.xAxisData,
        yAxisData: dataGrid.yAxisData,
        y2AxisData: dataGrid?.y2AxisData,
        i: dataGrid.i,
        x: dataGrid.x,
        y: dataGrid.y,
        w: dataGrid.w,
        h: dataGrid.h,
        coordinates: dataGrid.coordinates.map(
          (coord: Coordinates): BaseCoordinates => {
            return {
              path: coord.path,
              target: coord.target,
              valueIndex: coord.valueIndex,
            };
          },
        ),
        plot: dataGrid.plot.map((plot): BaseDataPlotly => {
          const suffix = plot.nodeUri.split('#')[1];
          const newNodeUri = `${plot.labelUri}#${suffix}`;

          return {
            nodeUri: newNodeUri,
            yaxis: plot?.yaxis || '',
            labelUri: plot.labelUri,
          };
        }),
      }),
    );

    // Remove ' (x)' at the end of the name if there has been name duplicates during configuration load
    const correctedName = active.name.replace(/\s*\(\d+\)$/, '');
    let savedConfig = false;

    const newIbexState: ConfigurationToSave = {
      name: correctedName,
      dataURI: active.dataURI,
      lastURIInput: active.lastURIInput,
      lastLocalDataSetSelected: active.lastLocalDataSetSelected,
      dataPlot: dataGridWithoutData,
    };
    if (active?.path) {
      await window.api.fs.writeFile(
        active.path,
        JSON.stringify(newIbexState, null, 2),
      );
      savedConfig = true;
    } else {
      await window.api.fs
        .saveAsDialog(`${active.name}IbexState.json`, 'json')
        .then((path: string) => {
          if (path) {
            active.path = path;
            window.api.fs.writeFile(
              path,
              JSON.stringify(newIbexState, null, 2),
            );
            savedConfig = true;
          }
        });
    }

    const updateActive: Configuration = {
      ...active,
      saved: savedConfig,
    };

    updatedConfiguration(updateActive);
  };

  const handleLoadConfiguration = async () => {
    await window.api.fs
      .getFilePathDialog('json')
      .then(async (path: string | null) => {
        if (path) {
          await window.api.fs.readFile(path).then(async (data: string) => {
            const newIbexState: ConfigurationToSave = JSON.parse(data);

            const configurationNameAlreadyExists = configurations.some(value => {
              if (value.name == newIbexState.name) return true;
            });

            if (configurationNameAlreadyExists) {
              const configurationAlreadyLoaded = configurations.some(value => {
                if (value.path == path) return true;
              });

              if (configurationAlreadyLoaded) {
                showNotification({
                  title: 'Configuration already loaded',
                  message: `The configuration ${newIbexState.name} is already loaded.`,
                  color: 'orange',
                });
                return;
              }

              // We have a duplicate configuration name
              // We will add a (x) to the name until there is no name duplicate in the configuration list
              let offsetName = 1;
              let newConfigurationName = newIbexState.name;
              while (configurations.some(value => {
                if (value.name == newConfigurationName) return true;
              })) {
                newConfigurationName = newIbexState.name + ` (${offsetName})`;
                offsetName++;
              }

              newIbexState.name = newConfigurationName;
            }

            const newListDataGridPlot: DataGridPlot[] =
              newIbexState.dataPlot.map(
                (data): DataGridPlot => ({
                  ...data,
                  isEditing: false,
                  static: false,
                  coordinates:
                    data.coordinates && data.coordinates.length > 0
                      ? data.coordinates.map(
                          (coord: BaseCoordinates, index): Coordinates => {
                            return {
                              ...coord,
                              name: '',
                              shape: [],
                              downsampled_shape: [],
                              coordinates: [],
                              data: [],
                              axeIndex: index,
                            };
                          },
                        )
                      : [],
                  plot: data.plot.map((plot): DataPlotly => {
                    const matched = newIbexState.dataURI.find(
                      (uri: URIData) => plot.labelUri === uri.name,
                    );

                    let fullNodeUri = plot.nodeUri;
                    if (matched) {
                      const suffix = plot.nodeUri.slice(matched.name.length);
                      fullNodeUri = `${matched.uri}${suffix}`;
                    }

                    return {
                      ...plot,
                      nodeUri: fullNodeUri,
                      yData: [],
                      x: [],
                      y: [],
                    };
                  }),
                }),
              );

            const newConfig: Configuration = {
              name: newIbexState.name,
              dataURI: newIbexState.dataURI,
              customDataTree: updateCustomDataTree([], newIbexState.dataURI),
              checkedNodeURI: [],
              dataPlot: await plotNodeUriLoaded(newListDataGridPlot),
              saved: true,
              path: path,
            };

            addConfiguration(newConfig);
            setActive(newConfig.name);
          });
        }
      });
  };

  const handleSelectConfiguration = (value: string) => {
    setActive(value);
  };

  return (
    <AppShell header={{ height: 70 }}>
      <AppShell.Header>
        <Header
          active={active}
          configurations={configurations.map((configuration) => ({
            value: configuration?.name,
            label: configuration?.name,
          }))}
          handleAddConfiguration={openConfigCreateModal}
          handleRemoveConfiguration={() =>
            !active?.saved
              ? openConfigDeleteModal()
              : removeConfiguration(active?.name)
          }
          handleSaveConfiguration={handleSaveConfiguration}
          handleLoadConfiguration={handleLoadConfiguration}
          handleSelectConfiguration={handleSelectConfiguration}
          handleAddTree={openAddTreeModal}
        />
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
        <ConfigCreateModal
          isOpen={isConfigCreateModalOpen}
          configurationsNames={configurations.map((c) => c?.name)}
          onClose={closeConfigCreateModal}
          handleAddConfiguration={handleAddConfiguration}
        />

        <ConfirmModal
          isOpen={isConfigDeleteModalOpen}
          onClose={closeConfigDeleteModal}
          onConfirm={handleRemoveConfiguration}
        >
          <Text size="sm" data-testid="config-delete-confirmation-text">
            Are you sure you want to delete the configuration?
          </Text>
        </ConfirmModal>

        <VisualizationURIModal
          opened={isAddTreeModalOpen}
          close={closeAddTreeModal}
        />
      </AppShell.Main>
    </AppShell>
  );
}
