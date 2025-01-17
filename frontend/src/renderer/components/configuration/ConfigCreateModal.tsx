import { Button, Center, Modal, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';
import { ConfigForm } from 'src/renderer/types';

interface Props {
  configurationsNames: string[];
  isOpen: boolean;
  onClose: () => void;
  handleAddConfiguration: (data: ConfigForm) => void;
}

export function ConfigCreateModal({
  configurationsNames,
  isOpen,
  onClose,
  handleAddConfiguration,
}: Props) {
  const form = useForm<ConfigForm>({
    initialValues: {
      name: '',
    },
    validate: {
      name: (value) =>
        value.length < 1
          ? 'This field is required'
          : configurationsNames.some((name) => name === value)
            ? 'This name is already taken'
            : null,
    },
  });

  function handleSubmit(data: ConfigForm) {
    handleAddConfiguration(data);
    form.reset();
    onClose();
  }

  function handleValidationError() {
    showNotification({
      title: 'Form validation error',
      message: 'Some required fields are missing',
      color: 'red',
    });
  }

  return (
    <Modal opened={isOpen} onClose={onClose} title="Create config" size="sm">
      <form onSubmit={form.onSubmit(handleSubmit, handleValidationError)}>
        <Stack>
          <TextInput
            label="Name"
            {...form.getInputProps('name')}
            data-autofocus
          />
          <Center mt="md">
            <Button type="submit">Create</Button>
          </Center>
        </Stack>
      </form>
    </Modal>
  );
}
