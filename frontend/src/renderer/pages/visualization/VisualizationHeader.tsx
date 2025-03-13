import { Button, Container, Group } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useIbexStore } from '../../stores';

interface VisualizationHeaderProps {
  handleAddTree: () => void;
}

export const VisualizationHeader = ({
  handleAddTree,
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
      </Group>
    </Container>
  );
};
