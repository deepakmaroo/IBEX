import { AppShell, Text } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import { useIbexStore } from '../stores';
import { useDisclosure } from '@mantine/hooks';
import {
  BaseConfiguration,
  ConfigForm,
  Configuration,
  DataPlot,
  DataPlotly,
} from '../types';
import { ConfigCreateModal, ConfirmModal, Header } from '../components';

export function MainLayout() {
  const {
    active,
    configurations,
    addConfiguration,
    removeConfiguration,
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

  const handleSaveConfiguration = () => {
    const dataPlotWithoutDataPlotly: DataPlot[] = active.dataPlot.map(
      (plot) => ({
        uuid: plot.uuid,
        static: plot.static,
        plot: plot.plot, // Too improve this
        yAxisName: plot.yAxisName,
        title: plot.title,
      }),
    );

    const newIbexState: BaseConfiguration = {
      name: active.name,
      dataURI: active.dataURI,
      checkedNodeURI: active.checkedNodeURI,
      lastURIInput: active.lastURIInput,
      lastLocalDataSetSelected: active.lastLocalDataSetSelected,
      dataPlot: dataPlotWithoutDataPlotly,
    };

    window.api.fs.saveAsDialog('ibexState.json', 'json').then((path) => {
      if (path) {
        window.api.fs.writeFile(path, JSON.stringify(newIbexState));
      }
    });
  };

  const handleLoadConfiguration = () => {
    window.api.fs.getFilePathDialog('json').then((path) => {
      if (path) {
        window.api.fs.readFile(path).then((data) => {
          const newIbexState: Configuration = JSON.parse(data);
          const newConfig: Configuration = {
            name: newIbexState.name,
            dataURI: newIbexState.dataURI,
            customDataTree: [],
            checkedNodeURI: newIbexState.checkedNodeURI,
            dataPlot: newIbexState.dataPlot,
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
          handleRemoveConfiguration={openConfigDeleteModal}
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
