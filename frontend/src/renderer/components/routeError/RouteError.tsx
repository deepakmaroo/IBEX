import { Alert, Button, Center, Container, Space } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { Link, useRouteError } from 'react-router-dom';

export function RouteError() {
  const error = useRouteError() as ErrorEvent;

  return (
    <Center>
      <Container>
        <Alert
          icon={<IconAlertCircle />}
          title="Une erreur est survenue .."
          color="red"
        >
          {error.message}
        </Alert>
        <Space h="md" />
        <Center>
          <Button component={Link} to="/" px="auto" color="red">
            Ok
          </Button>
        </Center>
      </Container>
    </Center>
  );
}
