import {
  ActionIcon,
  Autocomplete,
  Button,
  Center,
  Checkbox,
  Fieldset,
  FileInput,
  Group,
  Loader,
  Modal,
  Pagination,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { useIbexStore } from '../../stores';
import { URIData } from 'src/renderer/types';
import { useEffect, useState } from 'react';
import { IconPlus } from '@tabler/icons-react';
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

interface FormDbEntries {
  user: string;
  backend: string;
  database: string;
  version: string;
}

function getColorRandom(): string {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}

export const VisualizationIDSFromURIModal = ({
  opened,
  close,
}: VisualizationSelectIDSModalProps) => {
  const { active, updatedConfiguration } = useIbexStore();
  const [dataURIsSelected, setDataURIsSelected] = useState<URIData[]>([]);
  const [dataDbEntries, setDataDbEntries] = useState<URIData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDbEntries, setIsLoadingDbEntries] = useState(false);
  const [isLoadedDbEntries, setIsLoadedDbEntries] = useState(false);
  const [activePage, setPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [fromURIisSuccess, setFromURIisSuccess] = useState(false);
  const [fromFileisSuccess, setFromFileisSuccess] = useState(false);

  const formIDS = useForm<FormIDS>({
    initialValues: {
      file: null,
      uri: '',
    },
  });

  const formDbEntries = useForm<FormDbEntries>({
    initialValues: {
      user: 'public',
      backend: '',
      database: '',
      version: '3',
    },
    validate: {
      user: (value) => (value.length < 1 ? 'User is required' : undefined),
      // backend: (value) =>
      //   value.length < 1 ? 'Backend is required' : undefined,
      // database: (value) =>
      //   value.length < 1 ? 'Database is required' : undefined,
      version: (value) =>
        value.length < 1 ? 'Version is required' : undefined,
    },
  });

  useEffect(() => {
    if (active?.dataURI) {
      setDataURIsSelected(active?.dataURI);
    }
  }, [active?.dataURI]);

  const tableHeaders = (
    <Table.Tr>
      <Table.Th>Select</Table.Th>
      <Table.Th>Name</Table.Th>
      <Table.Th>URI</Table.Th>
    </Table.Tr>
  );

  // Pagination logic: calculate rows for the current page
  const startIndex = (activePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = dataDbEntries.slice(startIndex, endIndex);

  const tableRows = currentPageData.map((element, index) => (
    <Table.Tr key={`table-${element.name}-${index}`}>
      <Table.Td>
        <Checkbox
          radius="sm"
          size="sm"
          w={50}
          onChange={() => handleCheckUri(element.uri, dataDbEntries)}
          checked={
            dataURIsSelected?.findIndex(
              (d: URIData) => d.uri === element.uri,
            ) !== -1
          }
        />
      </Table.Td>
      <Table.Td>{element.name}</Table.Td>
      <Table.Td>{element.uri}</Table.Td>
    </Table.Tr>
  ));

  /**
   * Handle check uri
   * @param uri
   * @param dataEntries
   * @returns
   */
  const handleCheckUri = (uri: string, dataEntries: URIData[]): void => {
    //Verify if dataIDSSelected[] contains the uri then use the color of the uri or generate a new color
    const color =
      dataURIsSelected?.findIndex((d: URIData) => d.uri === uri) !== -1
        ? dataURIsSelected.find((d) => d.uri === uri)?.uriColor
        : getColorRandom();

    const updateDataURIs: URIData[] = dataURIsSelected.some(
      (d) => d.uri === uri,
    )
      ? dataURIsSelected.filter((d) => !(d.uri === uri))
      : [
          ...dataURIsSelected,
          {
            name: dataEntries.find((d) => d.uri === uri)?.name,
            uri,
            uriColor: color,
          },
        ];

    setDataURIsSelected(updateDataURIs);
  };

  /**
   * Update data URI
   * @returns
   */
  const updateDataURI = (): void => {
    updatedConfiguration({ ...active, dataURI: dataURIsSelected });
    close();
  };

  /**
   * Fetch IDS data from URI
   * @returns {Promise<void>}
   * Return data uri with name and occurrences
   *
   */
  async function fetchDataIDSFromURI() {
    if (!formIDS.values.uri) {
      console.error('URI is empty.');
      formIDS.setFieldError('uri', 'Please provide a valid URI');
      return;
    }

    try {
      setIsLoading(true);

      const config = await window.api.getConfig();
      if(!config) {
        throw new Error('Failed to load configuration');
      }
      
      // Verify if the URI exists
      const responseURIExists = await fetch(
        `${config.API_URL}/data_entry/exists/?uri=${encodeURIComponent(formIDS.values.uri)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!responseURIExists.ok) {
        const error = await responseURIExists.json();
        throw new Error(error.detail || 'Failed to verify URI existence');
      }

      const existsResult = await responseURIExists.json();
      if (!existsResult.exists) {
        formIDS.setFieldError('uri', 'URI does not exist');
        showNotification({
          title: 'Error',
          message: 'URI does not exist',
          color: 'red',
        });
        return;
      }

      if (dataURIsSelected.some((d) => d.uri === formIDS.values.uri)) {
        formIDS.setFieldError('uri', 'URI already added');
        showNotification({
          title: 'Error',
          message: 'URI already added',
          color: 'red',
        });
        return;
      }

      if (dataDbEntries.some((d) => d.uri === formIDS.values.uri)) {
        //if uri in dataDbEntries, then add to dataURIsSelected
        handleCheckUri(formIDS.values.uri, dataDbEntries);
        setFromURIisSuccess(true);
        setFromFileisSuccess(false);
        return;
      }

      const oldDataEntriesSelected = dataDbEntries.filter((loaded) =>
        dataURIsSelected.some((selected) => selected.uri === loaded.uri),
      );
      const newDataEntries = [
        ...oldDataEntriesSelected,
        {
          name: `URI-${dataDbEntries.length}`,
          uri: formIDS.values.uri,
          uriColor: getColorRandom(),
        },
      ];

      setDataDbEntries(newDataEntries);
      handleCheckUri(formIDS.values.uri, newDataEntries);
      setFromURIisSuccess(true);
      setFromFileisSuccess(false);
    } catch (error) {
      console.error('Error:', error.message || error);
      formIDS.setFieldError('uri', error.message || 'An error occurred');
      showNotification({
        title: 'Error',
        message: error.message || 'Failed to fetch data',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Fetch IDS data from file
   * @returns {Promise<void>}
   * Return data uri with name and occurrences
   */
  async function fetchDataIDSFromFile() {
    const formData = new FormData();
    formData.append('file', formIDS.values.file);

    //Print the file to check if it is being sent
    formData.forEach((value, key) => {
      console.log(`${key}:`, value);
    });

    try {
      setIsLoading(true);

      // const response = await fetch(
      //   `${config.API_URL}/data_entry/list_idses_from_file/`,
      //   {
      //     method: 'POST',
      //     body: formData,
      //   },
      // );

      // if (response.ok) {
      //   const res = await response.json();
      //   // setDataIDsLoaded(res.idses);
      //   setFromURIisSuccess(false);
      //   setFromFileisSuccess(true);
      // } else {
      //   const res = await response.json();
      //   console.error('Promise resolved but HTTP status failed:', res);
      //   formIDS.setFieldError(
      //     'file',
      //     'Failed to fetch data for the provided file',
      //   );
      //   showNotification({
      //     title: 'Error',
      //     message: res.datail,
      //     color: 'red',
      //   });
      // }
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

  /**
   * Fetch IDS data from db entries
   * @returns {Promise<void>}
   * Return data uri with name and occurrences
   */
  async function fetchDbEntries() {
    try {

      const config = await window.api.getConfig();
      if(!config) {
        throw new Error('Failed to load configuration');
      }
      
      setIsLoadingDbEntries(true);
      const response = await fetch(
        `${config.API_URL}/data_entry/available_entries/?user=${formDbEntries.values.user}&backend=${formDbEntries.values.backend}&database=${formDbEntries.values.database}&version=${formDbEntries.values.version}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        const res = await response.json();

        const oldDataEntriesSelected = dataDbEntries.filter((loaded) =>
          dataURIsSelected.some((selected) => selected.uri === loaded.uri),
        );

        const maxId = Math.max(
          0,
          ...oldDataEntriesSelected.map((d) => {
            const match = d.name.match(/URI-(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
          }),
        );

        const newDataEntries: URIData[] = res.entries
          .filter(
            (entry: string) =>
              !oldDataEntriesSelected.some((d) => d.uri === entry),
          )
          .map((entry: string, index: number) => ({
            name: `URI-${maxId + index + 1}`,
            uri: entry,
          }));

        setDataDbEntries([...oldDataEntriesSelected, ...newDataEntries]);
        showNotification({
          title: 'Success',
          message: 'Data successfully fetched from db entries',
          color: 'green',
        });
      } else {
        const res = await response.json();
        console.error('Promise resolved but HTTP status failed:', res);
        formDbEntries.setErrors({
          user: 'Failed to fetch data',
          backend: 'Failed to fetch data',
          database: 'Failed to fetch data',
          version: 'Failed to fetch data',
        });
        showNotification({
          title: 'Error',
          message: res.datail,
          color: 'red',
        });
      }
    } catch (error) {
      console.error('Promise rejected:', error);
      formDbEntries.setErrors({
        user: 'Error occurred while fetching data',
        backend: 'Error occurred while fetching data',
        database: 'Error occurred while fetching data',
        version: 'Error occurred while fetching data',
      });
      showNotification({
        title: 'Error',
        message: 'Error to search IDS',
        color: 'red',
      });
    } finally {
      setIsLoadingDbEntries(false);
      setIsLoadedDbEntries(true);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={close}
      title="Select URIs"
      size="90%"
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
            },
          }}
          disabled={isLoading || isLoadingDbEntries}
        />

        <form
          onSubmit={formIDS.onSubmit(() => {
            fetchDataIDSFromURI();
          })}
          style={{
            width: 'calc(50% - 30px)',
          }}
        >
          <Autocomplete
            label="Write/Paste your URI"
            placeholder="Enter your uri"
            data={dataDbEntries.map((entry) => entry.uri)}
            rightSection={
              <ActionIcon
                variant="filled"
                aria-label="Add URI"
                component="button"
                type="submit"
                disabled={isLoading || isLoadingDbEntries}
              >
                <IconPlus
                  style={{ width: '70%', height: '70%' }}
                  stroke={1.5}
                />
              </ActionIcon>
            }
            styles={{
              input: {
                //green if success else default
                borderColor: fromURIisSuccess
                  ? '#00FF00'
                  : isLoadedDbEntries && dataDbEntries.length > 0
                    ? '#FFDD00'
                    : '',
              },
            }}
            disabled={isLoading || isLoadingDbEntries}
            {...formIDS.getInputProps('uri')}
          />
        </form>
      </Group>

      <Center>
        <Text>or</Text>
      </Center>

      <form
        onSubmit={formDbEntries.onSubmit(() => {
          fetchDbEntries();
        })}
      >
        <Fieldset
          legend="Legacy parameters"
          w="100%"
          mb={10}
          disabled={isLoading || isLoadingDbEntries}
        >
          <Group justify="space-between">
            <TextInput
              label="User"
              placeholder="Enter user name"
              withAsterisk
              {...formDbEntries.getInputProps('user')}
              w="calc(20% - 15px)"
            />
            <TextInput
              label="Backend"
              placeholder="Enter backend name"
              w="calc(20% - 15px)"
              {...formDbEntries.getInputProps('backend')}
              withAsterisk
            />
            <TextInput
              label="Database"
              placeholder="Enter plot name"
              w="calc(20% - 15px)"
              {...formDbEntries.getInputProps('database')}
              withAsterisk
            />
            <TextInput
              label="Version"
              placeholder="Enter plot name"
              w="calc(20% - 15px)"
              {...formDbEntries.getInputProps('version')}
              withAsterisk
            />
            <Button
              w="calc(20% - 15px)"
              mt={25}
              type="submit"
              leftSection={
                isLoadingDbEntries && <Loader color="blue" size="sm" />
              }
            >
              Search db entries
            </Button>
          </Group>
        </Fieldset>
      </form>

      <Table withTableBorder>
        <Table.Thead>{tableHeaders}</Table.Thead>

        <Table.Caption>
          {isLoading && <Loader color="blue" />}
          {dataDbEntries.length === 0 && !isLoading && (
            <Text>No uri added</Text>
          )}
        </Table.Caption>

        <Table.Tbody>{tableRows}</Table.Tbody>
      </Table>

      <Group justify="center" mt={20}>
        <Pagination
          total={Math.ceil(dataDbEntries.length / itemsPerPage)}
          value={activePage}
          onChange={setPage}
        />
      </Group>

      <Group justify="flex-end" mt={20}>
        <Button disabled={!dataURIsSelected.length} onClick={updateDataURI}>
          Validate
        </Button>
      </Group>
    </Modal>
  );
};
