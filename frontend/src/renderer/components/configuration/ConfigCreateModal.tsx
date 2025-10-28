import {
  Button,
  Center,
  Checkbox,
  FileInput,
  Modal,
  Select,
  Stack,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';
import { useState } from 'react';
import { ConfigForm } from 'src/renderer/types';

interface Props {
  configurationsNames: string[];
  isOpen: boolean;
  onClose: () => void;
  handleAddConfiguration: (data: ConfigForm) => void;
  handleAddTree: () => void;
}

export function ConfigCreateModal({
  configurationsNames,
  isOpen,
  onClose,
  handleAddConfiguration,
  handleAddTree,
}: Props) {
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedFolderTemplate, setSelectedFolderTemplate] = useState<
    string | null
  >(null);
  const [selectedLocalTemplate, setSelectedLocalTemplate] =
    useState<File | null>(null);

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

    // Show URIs selection modal
    handleAddTree();
    resetTemplates();
  }

  function handleValidationError() {
    showNotification({
      title: 'Form validation error',
      message: 'Some required fields are missing',
      color: 'red',
    });
  }

  const handleUseTemplate = (checked: boolean) => {
    setUseTemplate(checked);
    if (!checked) resetTemplates();
  };

  // Used to reset templates fields
  const resetTemplates = () => {
    setSelectedFolderTemplate(null);
    setSelectedLocalTemplate(null);
  };

  const handleSelectFolderTemplate = async (value: string) => {
    setSelectedFolderTemplate(value);
    setSelectedLocalTemplate(null);
  };

  const handleSelectLocalTemplate = async () => {
    // Open file selector
    const localFilePath: string = await window.api.fs.getFilePathDialog('json');

    // Reset selected template from folder
    setSelectedFolderTemplate(null);

    // Save local template in useState
    if (!localFilePath) {
      return;
    }

    const response = await fetch(localFilePath);
    const blob = await response.blob();

    const splittedPath = localFilePath.split('/');
    const filename = splittedPath[splittedPath.length - 1];

    const file = new File([blob], filename, { type: blob.type });
    setSelectedLocalTemplate(file);
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title="Create config"
      size="sm"
      data-testid="config-create-modal"
    >
      <form onSubmit={form.onSubmit(handleSubmit, handleValidationError)}>
        <Stack>
          <TextInput
            label="Name"
            {...form.getInputProps('name')}
            data-autofocus
            data-testid="config-create-name-input"
          />
          <Checkbox
            label="Use template"
            radius="sm"
            size="sm"
            checked={useTemplate}
            onChange={(event) => handleUseTemplate(event.currentTarget.checked)}
          />
          {useTemplate && (
            <>
              <Select
                label="Template from folders"
                value={selectedFolderTemplate}
                data={['A', 'B', 'C']}
                onChange={handleSelectFolderTemplate}
              />

              <FileInput
                clearable
                label="Local template"
                placeholder="Select local imas file"
                value={selectedLocalTemplate ?? null}
                onClick={handleSelectLocalTemplate}
                onChange={(value) => {
                  if (value === null) {
                    setSelectedLocalTemplate(null);
                  }
                }}
              />
            </>
          )}
          <Center mt="md">
            <Button type="submit" data-testid="config-create-submit-button">
              Select URIs
            </Button>
          </Center>
        </Stack>
      </form>
    </Modal>
  );
}
