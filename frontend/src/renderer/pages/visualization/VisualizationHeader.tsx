import { Button, Container, Group } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useIbexState } from '../../stores';

interface VisualizationHeaderProps {
  handleAddTree: () => void;
}

export const VisualizationHeader = ({
  handleAddTree,
}: VisualizationHeaderProps) => {
  const { active } = useIbexState();

  return (
    <Container fluid pb={10}>
      <Group justify="flex-end">
        <Button
          onClick={handleAddTree}
          leftSection={<IconPlus size={20} />}
          disabled={!active}
        >
          Select IDS
        </Button>
        <Button
          leftSection={<IconPlus size={20} />}
          disabled={!active.dataIDS.length}
        >
          New Chart
        </Button>
      </Group>
    </Container>
  );
};
