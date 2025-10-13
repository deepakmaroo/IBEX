import {
  Button,
  Center,
  ComboboxData,
  Container,
  Divider,
  Group,
  Image,
  Select,
  Title,
  Tooltip,
} from '@mantine/core';
import logoPath from '../../assets/imas_extra.png';
import { Configuration } from 'src/renderer/types';
import { IconPlus, IconCircleFilled } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { fetchInfoVersion } from '../../utils';

interface HeaderProps {
  active: Configuration;
  configurations: ComboboxData;
  handleAddConfiguration: () => void;
  handleRemoveConfiguration: () => void;
  handleSaveConfiguration: () => void;
  handleLoadConfiguration: () => void;
  handleSelectConfiguration: (value: string) => void;
  handleAddTree: () => void;
}

export const Header = ({
  active,
  configurations,
  handleAddConfiguration,
  handleRemoveConfiguration,
  handleSaveConfiguration,
  handleLoadConfiguration,
  handleSelectConfiguration,
  handleAddTree,
}: HeaderProps) => {
  const [isServerResponding, setIsServerResponding] = useState(true);

  const configurationButtons = (
    <Group>
      <Button
        onClick={handleAddConfiguration}
        data-testid="header-add-configuration"
        variant="outline"
      >
        Add
      </Button>
      <Button
        onClick={handleLoadConfiguration}
        data-testid="header-load-configuration"
        variant="outline"
      >
        Load
      </Button>
      <Button
        onClick={handleSaveConfiguration}
        disabled={configurations.length === 0 || active?.saved}
        data-testid="header-save-configuration"
      >
        {active?.path ? 'Save' : 'Save as'}
      </Button>
      <Button
        onClick={handleRemoveConfiguration}
        disabled={configurations.length === 0}
        variant="outline"
        color="red"
        data-testid="header-delete-configuration"
      >
        Delete
      </Button>
    </Group>
  );

  const visualisationButtons = (
    <Group justify="flex-end">
      <Button
        onClick={handleAddTree}
        leftSection={<IconPlus size={20} />}
        disabled={!active}
      >
        Select URIs
      </Button>
    </Group>
  );

  const serverStatus = (
    <Group>
      <Tooltip label="Server status">
        <IconCircleFilled
          size={20}
          color={isServerResponding ? 'green' : 'red'}
        />
      </Tooltip>
    </Group>
  );

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const timeoutId = window.setTimeout(() => {
          setIsServerResponding(false); // Timeout of 5 seconds
        }, 5000);
        await fetchInfoVersion();
        clearTimeout(timeoutId);
        setIsServerResponding(true);
      } catch (error) {
        console.error('Error checking server status:', error);
        setIsServerResponding(false);
      }
    };
    const interval = window.setInterval(fetchVersion, 10000); // Check server status each 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <Container fluid p={5}>
      <Group justify="space-between">
        <Group>
          <Center px={10}>
            <Image src={logoPath} alt="logo" width={35} height={35} />
            <Title order={2} fw="bold" ml={2}>
              Ibex Tool
            </Title>
          </Center>
          <Select
            w="15vw"
            maw="195px"
            data-testid="header-select-configuration"
            size="xs"
            key={active?.name || 'default'}
            placeholder="Configuration"
            data={configurations}
            value={active?.name}
            label="Configurations"
            onChange={handleSelectConfiguration}
            inputContainer={(children) => (
              <Tooltip
                openDelay={500}
                label="Select configuration to set as current configuration."
                position="top-start"
              >
                {children}
              </Tooltip>
            )}
          />
        </Group>
        <Group p={12}>
          {configurationButtons}
          <Divider orientation="vertical" />
          {visualisationButtons}
          <Divider orientation="vertical" />
          {serverStatus}
        </Group>
      </Group>
    </Container>
  );
};
