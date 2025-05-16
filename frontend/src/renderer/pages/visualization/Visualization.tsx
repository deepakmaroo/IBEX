import {
  Center,
  Container,
  Paper,
  Text,
} from '@mantine/core';
import { useIbexStore } from '../../stores';
import { VisualizationTree } from './VisualizationTree';
import { VisualizationPlot } from './VisualizationPlot';
import { VisualizationMetaData } from './VisualizationMetaData';
import { useDisclosure } from '@mantine/hooks';

export const Visualization = () => {
  const { active, configurations } = useIbexStore();
  const [opened, { toggle }] = useDisclosure(true);

  const HEIGHT = '88vh';

  const leftWidth = opened ? '16.666%' : '3%'; // span=2 or 1 on 12
  const rightWidth = opened ? '83.333%' : '97%'; // span=10 or 11 on 12

  return (
    <Container fluid p={10}>
      {configurations.length > 0 ? (
        <div style={{ display: 'flex', transition: 'width 0.3s ease' }}>
          <div
            style={{
              width: leftWidth,
              transition: 'width 0.3s ease',
              marginRight: '10px',
            }}
          >
            <Paper shadow="md" h={HEIGHT} radius="md" pt="sm">
              <VisualizationTree height={HEIGHT} extended={opened} handleExtended={toggle}/>
            </Paper>
          </div>

          <div
            style={{
              width: rightWidth,
              transition: 'width 0.3s ease',
            }}
          >
            <Paper shadow="md" h={HEIGHT} radius="md">
              {active?.gridLayoutSelected ? (
                <VisualizationMetaData />
              ) : (
                <VisualizationPlot />
              )}
            </Paper>
          </div>
        </div>
      ) : (
        <Center h={HEIGHT}>
          <Text>No configurations available</Text>
        </Center>
      )}
    </Container>
  );
};
