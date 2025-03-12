import { Button, Container, Group } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useIbexStore } from '../../stores';

interface VisualizationHeaderProps {
  handleAddTree: () => void;
  handleNewPlot: () => void;
}

export const VisualizationHeader = ({
  handleAddTree,
  handleNewPlot,
}: VisualizationHeaderProps) => {
  const { active } = useIbexStore();

  return (
    <Container fluid pb={10}>
      <Group justify="flex-end">
        <Button
          onClick={handleAddTree}
          leftSection={<IconPlus size={20} />}
          disabled={!active}
        >
          Select URIs
        </Button>
        <Button
          leftSection={<IconPlus size={20} />}
          disabled={!active.dataURI.length}
          onClick={handleNewPlot}
        >
          New Chart
        </Button>
      </Group>
    </Container>
  );
};
