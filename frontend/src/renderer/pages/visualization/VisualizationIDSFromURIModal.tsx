import { Button, Checkbox, Group, Modal, Table } from '@mantine/core';
import { useIbexState } from '../../stores';
import { temporaryDataIDSLoaded } from './data.temp';
import { IDSData } from 'src/renderer/types';
import { useEffect, useState } from 'react';

interface VisualizationSelectIDSModalProps {
  opened: boolean;
  close: () => void;
}

export const VisualizationIDSFromURIModal = ({
  opened,
  close,
}: VisualizationSelectIDSModalProps) => {
  const { active, updatedConfiguration } = useIbexState();
  const [dataIDS, setDataIDS] = useState<IDSData[]>([]);
  const [dataIDSLoaded, setDataIDSLoaded] = useState<IDSData[]>([]);

  useEffect(() => {
    if (active?.dataIDS) {
      setDataIDS(active?.dataIDS);
    }
  }, [active?.dataIDS]);

  useEffect(() => {
    /**
     * Here we can load the data IDS from backend api
     * and set the dataIDSLoaded state
     * 
     * Actually we are using a temporary data from data.temp.ts
     */
    setDataIDSLoaded(temporaryDataIDSLoaded);
  }, []);

  const tableHeaders = (
    <Table.Tr>
      <Table.Th>Select</Table.Th>
      <Table.Th>Name</Table.Th>
    </Table.Tr>
  );

  const tableRows = dataIDSLoaded.map((element) => (
    <Table.Tr key={`table-${element.name}`}>
      <Table.Td>
        <Checkbox
          radius="sm"
          size="sm"
          w={50}
          onChange={() => handleCheckIds(element.name)}
          checked={
            dataIDS?.findIndex((d: IDSData) => d.name === element.name) !== -1
          }
        />
      </Table.Td>
      <Table.Td>{element.name}</Table.Td>
    </Table.Tr>
  ));

  const handleCheckIds = (name: string): void => {
    const updateDataIDS: IDSData[] =
      dataIDS?.findIndex((d: IDSData) => d.name === name) !== -1
        ? dataIDS?.filter((d: IDSData) => d.name !== name)
        : [...dataIDS, dataIDSLoaded.find((d: IDSData) => d.name === name)];

    setDataIDS(updateDataIDS);
  };

  const updateDataIDS = (): void => {
    updatedConfiguration({ ...active, dataIDS });
    close();
  };

  return (
    <Modal
      opened={opened}
      onClose={close}
      title="Select IDS"
      size="70%"
      centered
    >
      <Table withTableBorder>
        <Table.Thead>{tableHeaders}</Table.Thead>
        <Table.Tbody>{tableRows}</Table.Tbody>
      </Table>
      <Group justify="flex-end" mt={20}>
        <Button disabled={!dataIDS.length} onClick={updateDataIDS}>
          Validate
        </Button>
      </Group>
    </Modal>
  );
};
