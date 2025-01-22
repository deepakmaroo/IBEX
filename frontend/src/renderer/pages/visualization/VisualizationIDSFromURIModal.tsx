import {
  ActionIcon,
  Button,
  Checkbox,
  FileInput,
  Group,
  Modal,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { useIbexState } from '../../stores';
import { IDSData } from 'src/renderer/types';
import { useEffect, useState } from 'react';
import { IconSearch } from '@tabler/icons-react';
import { showNotification } from '@mantine/notifications';

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
  const [uri, setUri] = useState<string>('');

  useEffect(() => {
    if (active?.dataIDS) {
      setDataIDS(active?.dataIDS);
    }
  }, [active?.dataIDS]);

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

  useEffect(() => {
    console.log('BACKEND_API_URL', window.env.API_URL);
  }, []);

  async function seachDataIDSFromURI() {
    if (!uri) {
      console.error('URI is empty.');
      return;
    }

    try {
      const response = await fetch(
        `${window.env.API_URL}/data_entry/list_idses/?uri=${encodeURIComponent(uri)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        const res = await response.json();
        setDataIDSLoaded(res.idses);
      } else {
        const res = await response.json();
        console.error('Promise resolved but HTTP status failed:', res);
        showNotification({
          title: 'Error',
          message: res.error,
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Promise rejected:', error);
      showNotification({
        title: 'Error',
        message: 'Error to search IDS',
        color: 'red',
      });
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={close}
      title="Select IDS"
      size="70%"
      centered
    >
      <Group justify="space-between" mb={10}>
        <FileInput
          label="Load local dataset"
          placeholder="Select local imas file"
          onChange={(files) => console.log(files)}
          w="calc(50% - 30px)"
          clearable
        />
        <Text>or</Text>
        <TextInput
          label="Write/Paste your URI"
          placeholder="Enter your uri"
          onChange={(event) => setUri(event.currentTarget.value)}
          value={uri}
          w="calc(50% - 30px)"
          rightSection={
            <ActionIcon variant="filled" aria-label="Settings">
              <IconSearch
                style={{ width: '70%', height: '70%' }}
                stroke={1.5}
                onClick={seachDataIDSFromURI}
              />
            </ActionIcon>
          }
        />
      </Group>
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
