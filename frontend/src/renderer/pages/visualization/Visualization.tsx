import { Center, Container, Grid, Paper, Text } from '@mantine/core';
import { useIbexStore } from '../../stores';
import { VisualizationHeader } from './VisualizationHeader';
import { useDisclosure } from '@mantine/hooks';
import { VisualizationIDSFromURIModal } from './VisualizationIDSFromURIModal';
import { VisualizationTree } from './VisualizationTree';
import { VisualizationPlot } from './VisualizationPlot';
import { VisualizationCustomPlotModal } from './VisualizationCustomPlotModal';

export const Visualization = () => {
  const { configurations } = useIbexStore();

  const [
    isAddTreeModalOpen,
    { open: openAddTreeModal, close: closeAddTreeModal },
  ] = useDisclosure(false);

  const [
    isCustomPlotModalOpen,
    { open: openCustomPlotModal, close: closeCustomPlotModal },
  ] = useDisclosure(false);

  const height = configurations.length > 0 ? '85vh' : '85vh';

  return (
    <Container fluid p={10}>
      {configurations.length > 0 ? (
        <>
          <VisualizationHeader handleAddTree={openAddTreeModal} handleNewPlot={openCustomPlotModal}/>
          <Grid grow type="container">
            <Grid.Col span={2}>
              <Paper shadow="md" h={height} radius="md">
                <VisualizationTree height={height} />
              </Paper>
            </Grid.Col>
            <Grid.Col span={10}>
              <Paper shadow="md" h={height} radius="md">
                <VisualizationPlot />
              </Paper>
            </Grid.Col>
          </Grid>
        </>
      ) : (
        <Center h={height}>
          <Text>No configurations available</Text>
        </Center>
      )}

      <VisualizationIDSFromURIModal
        opened={isAddTreeModalOpen}
        close={closeAddTreeModal}
      />

      <VisualizationCustomPlotModal
        opened={isCustomPlotModalOpen}
        close={closeCustomPlotModal}
      />
    </Container>
  );
};
