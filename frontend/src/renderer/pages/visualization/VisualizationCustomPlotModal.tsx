import { Grid, Modal, Paper, Text } from '@mantine/core';
import { VisualizationTree } from './VisualizationTree';

interface VisualizationCustomPlotModalProps {
  opened: boolean;
  close: () => void;
}

export const VisualizationCustomPlotModal = ({
  opened,
  close
}: VisualizationCustomPlotModalProps) => {
  const height = '85vh';

  return (
    <Modal
      opened={opened}
      onClose={close}
      title="Select IDS"
      size="70%"
      centered
    >
      <Grid grow type="container">
        <Grid.Col span={2}>
          <Paper shadow="md" h={height}>
            <VisualizationTree height={height} />
          </Paper>
        </Grid.Col>
        <Grid.Col span={10}>
          <Paper shadow="md" h={height}>
            <Text>Form</Text>
          </Paper>
        </Grid.Col>
      </Grid>
    </Modal>
  );
};
