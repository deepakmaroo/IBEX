import { Center, Container, Grid, Paper, Text } from '@mantine/core';
import { useIbexStore } from '../../stores';
import { VisualizationTree } from './VisualizationTree';
import { VisualizationPlot } from './VisualizationPlot';
import { VisualizationMetaData } from './VisualizationMetaData';

export const Visualization = () => {
  const { active, configurations } = useIbexStore();

  const HEIGHT = '89vh';

  return (
    <Container fluid p={10}>
      {configurations.length > 0 ? (
        <>
          <Grid type="container">
            <Grid.Col span={2}>
              <Paper shadow="md" h={HEIGHT} radius="md">
                <VisualizationTree height={HEIGHT} />
              </Paper>
            </Grid.Col>
            <Grid.Col span={10}>
              <Paper shadow="md" h={HEIGHT} radius="md">
                {active?.gridLayoutSelected ? (
                  <VisualizationMetaData />
                ) : (
                  <VisualizationPlot />
                )}
              </Paper>
            </Grid.Col>
          </Grid>
        </>
      ) : (
        <Center h={HEIGHT}>
          <Text>No configurations available</Text>
        </Center>
      )}
    </Container>
  );
};
