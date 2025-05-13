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
      (dataGrid: DataGridPlot) => ({
        title: dataGrid.title,
        xAxis: dataGrid.xAxis,
        yAxis: dataGrid.yAxis,
        y2Axis: dataGrid.y2Axis,
        i: dataGrid.i,
        x: dataGrid.x,
        y: dataGrid.y,
        w: dataGrid.w,
        h: dataGrid.h,
        coordinates: dataGrid.coordinates.map(
          (coord: Coordinates): BaseCoordinates => {
            const findUri = active.dataURI.find((uri: URIData) =>
              coord.nodeUri.includes(uri.uri),
            );

            const suffix = coord.nodeUri.split('#')[1];
            const newNodeUri = `${findUri?.name}#${suffix}`;
            return {
              target: coord.target,
              nodeUri: newNodeUri,
              value: coord.value,
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

    const newIbexState: ConfigurationToSave = {
      name: active.name,
      dataURI: active.dataURI,
      lastURIInput: active.lastURIInput,
      lastLocalDataSetSelected: active.lastLocalDataSetSelected,
      dataPlot: dataGridWithoutData,
    };
    if (active?.path) {
      await window.api.fs.writeFile(active.path, JSON.stringify(newIbexState));
    } else {
      await window.api.fs
        .saveAsDialog(`${active.name}IbexState.json`, 'json')
        .then((path) => {
          if (path) {
            active.path = path;
            window.api.fs.writeFile(path, JSON.stringify(newIbexState));
          }
        });
    }

    const updateActive: Configuration = {
      ...active,
      saved: true,
    };

    updatedConfiguration(updateActive);
  };

  const handleLoadConfiguration = async () => {
    await window.api.fs.getFilePathDialog('json').then(async (path) => {
      if (path) {
        await window.api.fs.readFile(path).then(async (data) => {
          const newIbexState: ConfigurationToSave = JSON.parse(data);

          const newListDataGridPlot: DataGridPlot[] = newIbexState.dataPlot.map(
            (data): DataGridPlot => ({
              ...data,
              isEditing: false,
              static: false,
              coordinates:
                data.coordinates && data.coordinates.length > 0
                  ? data.coordinates.map(
                      (coord: BaseCoordinates): Coordinates => {

                        const prefix = coord.nodeUri.split('#')[0];

                        const matched = newIbexState.dataURI.find(
                          (uri: URIData) => uri.name === prefix,
                        );

                        let fullNodeUri = coord.nodeUri;
                        if (matched){
                          const suffix = coord.nodeUri.split('#')[1];
                          fullNodeUri = `${matched.uri}#${suffix}`;
                        }
                        return {
                          ...coord,
                          nodeUri: fullNodeUri,
                          name: '',
                          shape: [],
                          data: [],
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
          <Text size="sm">
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
