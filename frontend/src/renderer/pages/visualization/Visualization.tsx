import { Center, Container, Grid, Paper, Text } from '@mantine/core';
import { useIbexState } from '../../stores';
import { VisualizationHeader } from './VisualizationHeader';
import { useDisclosure } from '@mantine/hooks';
import { TreeLibrariesAccordion } from '../../components';
import { CustomTreeData, DataTreeSelected } from 'src/renderer/types';
import { VisualizationSelectIDSModal } from './VisualizationSelectIDSModal';
import { customData } from './data.temp';
import { useEffect, useState } from 'react';

export const Visualization = () => {
  const { active, configurations } = useIbexState();
  const [customDataTree, setCustomDataTree] = useState<CustomTreeData[]>([]);

  const [
    isAddTreeModalOpen,
    { open: openAddTreeModal, close: closeAddTreeModal },
  ] = useDisclosure(false);

  useEffect(() => {
    /**
     * Here we can load the data tree from backend api
     * and set the customDataTree state
     *
     * Actually we are using a temporary data from data.temp.ts
     */
    if (active && active.dataIDS) {
      const newCustomDataTree: CustomTreeData[] = [];

      for (const ids of active.dataIDS) {
        const data = customData.find((d) => d.name === ids.name);
        if (data) {
          newCustomDataTree.push(data);
        }
      }
      setCustomDataTree(newCustomDataTree);
    }
  }, [active]);

  const height = configurations.length > 0 ? '85vh' : '85vh';

  const getDataSelected = (data: DataTreeSelected) => {
    console.log(data);
  };

  return (
    <Container fluid p={10}>
      {configurations.length > 0 ? (
        <>
          <VisualizationHeader handleAddTree={openAddTreeModal} />
          <Grid grow type="container">
            <Grid.Col span={2}>
              <Paper shadow="md" h={height} radius="md">
                <TreeLibrariesAccordion
                  dataTree={customDataTree}
                  getDataSelected={getDataSelected}
                  height={height}
                />
              </Paper>
            </Grid.Col>
            <Grid.Col span={10}>
              <Paper shadow="md" h={height} radius="md"></Paper>
            </Grid.Col>
          </Grid>
        </>
      ) : (
        <Center h={height}>
          <Text>No configurations available</Text>
        </Center>
      )}

      <VisualizationSelectIDSModal
        opened={isAddTreeModalOpen}
        close={closeAddTreeModal}
      />
    </Container>
  );
};
