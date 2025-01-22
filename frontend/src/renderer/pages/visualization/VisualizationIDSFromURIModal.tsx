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
import { useForm } from '@mantine/form';

interface VisualizationSelectIDSModalProps {
  opened: boolean;
  close: () => void;
}

interface FormIDS {
  file: File;
  uri: string;
}

export const VisualizationIDSFromURIModal = ({
  opened,
  close,
}: VisualizationSelectIDSModalProps) => {
  const { active, updatedConfiguration } = useIbexState();
  const [dataIDS, setDataIDS] = useState<IDSData[]>([]);
  const [dataIDSLoaded, setDataIDSLoaded] = useState<IDSData[]>([]);

  const formIDS = useForm<FormIDS>({
    initialValues: {
      file: null,
      uri: '',
    }
  });

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

  async function fetchDataIDSFromURI() {
    if (!formIDS.values.uri) {
      console.error('URI is empty.');
      return;
    }

    try {
      const response = await fetch(
        `${window.env.API_URL}/data_entry/list_idses/?uri=${encodeURIComponent(formIDS.values.uri)}`,
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
        formIDS.setFieldError(
          'uri',
          'Failed to fetch data for the provided URI',
        );
        showNotification({
          title: 'Error',
          message: res.error,
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Promise rejected:', error);
      formIDS.setFieldError('uri', 'Error occurred while fetching data');
      showNotification({
        title: 'Error',
        message: 'Error to search IDS',
        color: 'red',
      });
    }
  }

  async function fetchDataIDSFromFile() {


    const formData = new FormData();
    formData.append('file', formIDS.values.file);

    //Print the file to check if it is being sent
    formData.forEach((value, key) => {
      console.log(`${key}:`, value);
    });

    try {
      const response = await fetch(
        `${window.env.API_URL}/data_entry/list_idses_from_file/`,
        {
          method: 'POST',
          body: formData,
        },
      );

      if (response.ok) {
        const res = await response.json();
        setDataIDSLoaded(res.idses);
      } else {
        const res = await response.json();
        console.error('Promise resolved but HTTP status failed:', res);
        formIDS.setFieldError(
          'file',
          'Failed to fetch data for the provided file',
        );
        showNotification({
          title: 'Error',
          message: res.error,
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Promise rejected:', error);
      formIDS.setFieldError('file', 'Error occurred while fetching data');
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
          clearable
          label="Upload local dataset"
          placeholder="Select local imas file"
          value={formIDS.values.file}
          error={formIDS.errors.file}
          onChange={(file) => {
            if (file) {
              formIDS.setFieldValue('file', file);
              fetchDataIDSFromFile();
            } else {
              formIDS.setFieldValue('file', null);
            }
          }}
          w="calc(50% - 30px)"

        />
        <Text>or</Text>
        <form
          onSubmit={formIDS.onSubmit(() => {
            fetchDataIDSFromURI();
          })}
          style={{
            width: 'calc(50% - 30px)',
          }}
        >
          <TextInput
            label="Write/Paste your URI"
            placeholder="Enter your uri"
            {...formIDS.getInputProps('uri')}
            rightSection={
              <ActionIcon variant="filled" aria-label="Settings">
                <IconSearch
                  style={{ width: '70%', height: '70%' }}
                  stroke={1.5}
                  onSubmit={fetchDataIDSFromURI}
                />
              </ActionIcon>
            }
          />
        </form>
      </Group>
      <Table withTableBorder>
        <Table.Thead>{tableHeaders}</Table.Thead>
        {dataIDSLoaded.length === 0 && (
          <Table.Caption>No IDS found</Table.Caption>
        )}
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
