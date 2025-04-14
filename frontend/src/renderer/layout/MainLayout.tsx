import { AppShell, Text } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import { useIbexStore } from '../stores';
import { useDisclosure } from '@mantine/hooks';
import {
  BaseConfiguration,
  ConfigForm,
  Configuration,
  DataGridPlot,
} from '../types';
import { ConfigCreateModal, ConfirmModal, Header } from '../components';
import { plotNodeUriLoaded, updateCustomDataTree } from '../utils';

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
    const dataGridWithoutData: DataGridPlot[] = active.dataPlot.map(
      (dataGrid) => ({
        ...dataGrid,
        isEditing: false,
        plot: dataGrid.plot.map((plot) => ({
          ...plot,
          x: [],
          y: [],
        })),
      }),
    );

    const newIbexState: BaseConfiguration = {
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
          const newIbexState: BaseConfiguration = JSON.parse(data);
          const newConfig: Configuration = {
            name: newIbexState.name,
            dataURI: newIbexState.dataURI,
            customDataTree: updateCustomDataTree([], newIbexState.dataURI),
            checkedNodeURI: [],
            dataPlot: await plotNodeUriLoaded(newIbexState.dataPlot),
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
      </AppShell.Main>
    </AppShell>
  );
}
