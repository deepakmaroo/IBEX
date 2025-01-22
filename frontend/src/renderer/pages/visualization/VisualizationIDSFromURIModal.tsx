import {
  ActionIcon,
  Button,
  Checkbox,
  FileInput,
  Group,
  Loader,
  Modal,
  Pagination,
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
  const [isLoading, setIsLoading] = useState(false);
  const [activePage, setPage] = useState(1);
  const [itemsPerPage] = useState(3);
  const [fromURIisSuccess, setFromURIisSuccess] = useState(false);
  const [fromFileisSuccess, setFromFileisSuccess] = useState(false);

  const formIDS = useForm<FormIDS>({
    initialValues: {
      file: null,
      uri: '',
    },
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

  // Pagination logic: calculate rows for the current page
  const startIndex = (activePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = dataIDSLoaded.slice(startIndex, endIndex);

  const tableRows = currentPageData.map((element) => (
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
      setIsLoading(true);
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
        setFromURIisSuccess(true);
        setFromFileisSuccess(false);
      } else {
        const res = await response.json();
        console.error('Promise resolved but HTTP status failed:', res.detail);
        formIDS.setFieldError(
          'uri',
          'Failed to fetch data for the provided URI',
        );
        showNotification({
          title: 'Error',
          message: res.detail,
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
    setIsLoading(false);
  }

  async function fetchDataIDSFromFile() {
    const formData = new FormData();
    formData.append('file', formIDS.values.file);

    //Print the file to check if it is being sent
    formData.forEach((value, key) => {
      console.log(`${key}:`, value);
    });

    try {
      setIsLoading(true);
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
        setFromURIisSuccess(false);
        setFromFileisSuccess(true);
      } else {
        const res = await response.json();
        console.error('Promise resolved but HTTP status failed:', res);
        formIDS.setFieldError(
          'file',
          'Failed to fetch data for the provided file',
        );
        showNotification({
          title: 'Error',
          message: res.datail,
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
    setIsLoading(false);
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
          styles={{
            input: {
              //green if success else default
              borderColor: fromFileisSuccess ? '#00FF00' : '',
            }
          }}
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
              <ActionIcon
                variant="filled"
                aria-label="Settings"
                component="button"
                type="submit"
              >
                <IconSearch
                  style={{ width: '70%', height: '70%' }}
                  stroke={1.5}
                />
              </ActionIcon>
            }
            styles={{
              input: {
                //green if success else default
                borderColor: fromURIisSuccess ? '#00FF00' : '',
              }
            }}
          />
        </form>
      </Group>
      <Table withTableBorder>
        <Table.Thead>{tableHeaders}</Table.Thead>

        <Table.Caption>
          {isLoading && <Loader color="blue" />}
          {dataIDSLoaded.length === 0 && !isLoading && (
            <Text>No data found</Text>
          )}
        </Table.Caption>

        <Table.Tbody>{tableRows}</Table.Tbody>
      </Table>

       <Group justify="center" mt={20}>
        <Pagination
          total={Math.ceil(dataIDSLoaded.length / itemsPerPage)}
          value={activePage}
          onChange={setPage}
        />
      </Group>

      <Group justify="flex-end" mt={20}>
        <Button disabled={!dataIDS.length} onClick={updateDataIDS}>
          Validate
        </Button>
      </Group>
    </Modal>
  );
};
