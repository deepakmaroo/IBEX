import {
  Button,
  Center,
  ComboboxData,
  Container,
  Divider,
  Grid,
  Group,
  Image,
  Select,
  Title,
  Tooltip,
} from '@mantine/core';
import logoPath from '../../assets/imas_extra.png';
import { Configuration } from 'src/renderer/types';
import { IconPlus } from '@tabler/icons-react';

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
  const configurationButtons = (
    <Group>
      <Button onClick={handleAddConfiguration}  data-testid="header-add-configuration">Add configuration</Button>
      <Button onClick={handleLoadConfiguration}  data-testid="header-load-configuration">Load configuration</Button>
      <Button
        onClick={handleSaveConfiguration}
        disabled={configurations.length === 0 || active?.saved}
      >
        {active?.path ? 'Save configuration' : 'Save as configuration'}
      </Button>
      <Button
        onClick={handleRemoveConfiguration}
        disabled={configurations.length === 0}
        variant="outline"
        color="red"
        data-testid="header-select-configuration"
      >
        Delete Configuration
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

  return (
    <Container fluid p={5}>
      <Grid>
        <Grid.Col span={2}>
          <Center p={10}>
            <Image src={logoPath} alt="logo" width={35} height={35} />
            <Title order={2} fw="bold" ml={2}>
              Ibex Tool
            </Title>
          </Center>
        </Grid.Col>
        <Grid.Col span={2}>
          <Select
            data-testid="header-select-configuration"
            size="xs"
            key={active?.name || 'default'}
            placeholder="Configuration"
            data={configurations}
            value={active?.name}
            label="Configurations"
            h={50}
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
        </Grid.Col>
        <Grid.Col span={8}>
          <Group justify="flex-end" p={12}>
            {configurationButtons}
            <Divider orientation="vertical" />
            {visualisationButtons}
          </Group>
        </Grid.Col>
      </Grid>
    </Container>
  );
};
