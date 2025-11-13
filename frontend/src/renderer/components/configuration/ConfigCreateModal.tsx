import {
  Button,
  Center,
  Checkbox,
  FileInput,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';
import { useCallback, useEffect, useState } from 'react';
import { ConfigForm } from 'src/renderer/types';
import { readIbexConfig } from '../../utils';

type SelectTemplateData = { group: string; items: SelectDataItems }[];
type SelectDataItems = { value: string; label: string }[];
interface Props {
  configurationsNames: string[];
  isOpen: boolean;
  onClose: () => void;
  handleAddConfiguration: (data: ConfigForm, templatePath?: string) => void;
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
  const [templateFilesData, setTemplateFilesData] =
    useState<SelectTemplateData>([]);

  const [folderTemplate, setFolderTemplate] = useState('');
  const [localTemplate, setLocalTemplate] = useState('');
  const [localTemplateFile, setLocalTemplateFile] = useState<File | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');

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

  async function handleSubmit(data: ConfigForm) {
    if (!useTemplate) {
      // Add configuration
      handleAddConfiguration(data);
    } else {
      // Add configuration with template
      handleAddConfiguration(data, selectedTemplate);
    }

    // Reset forms from add modal
    resetFields();

    // Redirect to URIs selection modal
    onClose();
    handleAddTree();
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
    setFolderTemplate('');
    setLocalTemplateFile(null);
    setLocalTemplate('');
    setSelectedTemplate('');
  };

  const handleSelectFolderTemplate = async (value: string) => {
    setFolderTemplate(value);
  };

  const handleSelectLocalTemplate = async () => {
    // Open file selector
    const localFilePath: string = await window.api.fs.getFilePathDialog('json');
    setLocalTemplate(localFilePath);
  };

  const saveLocalTemplateFile = useCallback(
    async (localTemplatePath: string) => {
      if (!localTemplatePath) {
        return;
      }

      const response = await fetch(localTemplatePath);
      const blob = await response.blob();

      const splittedPath = localTemplatePath.split('/');
      const filename = splittedPath[splittedPath.length - 1];

      const file = new File([blob], filename, { type: blob.type });
      setLocalTemplateFile(file);
    },
    [],
  );

  const loadIbexConfig = useCallback(async () => {
    const userPreferences = await readIbexConfig();
    // Get default template folders
    if (userPreferences?.templateFolders?.length > 0) {
      // Get templateFolders to show paths & update config file
      const tempTemplateFilesData: SelectTemplateData = [];
      for (const templateFolder of userPreferences.templateFolders) {
        const listFiles: { name: string; isDirectory: boolean }[] =
          await window.api.fs.listFiles(templateFolder);
        const listFilesNames = listFiles
          .filter((file) => !file.isDirectory && file.name.endsWith('.json'))
          .map((file) => file.name);

        const itemList: SelectDataItems = [];
        for (const fileName of listFilesNames) {
          itemList.push({
            value: templateFolder + '/' + fileName,
            label: fileName,
          });
        }
        if (itemList.length) {
          tempTemplateFilesData.push({
            group: templateFolder,
            items: itemList,
          });
        }
      }
      // Used for discerning in Select labels from values
      setTemplateFilesData(tempTemplateFilesData);
    } else {
      setTemplateFilesData([]);
    }
  }, []);

  const resetFields = () => {
    form.reset();
    setUseTemplate(false);
    setFolderTemplate('');
    setLocalTemplateFile(null);
    setLocalTemplate('');
  };

  useEffect(() => {
    if (isOpen) {
      loadIbexConfig();
    } else {
      resetFields();
    }
  }, [isOpen]);

  useEffect(() => {
    // Set choosen template from folder as selected
    if (folderTemplate) {
      // Set folderTemplate to selected one
      setSelectedTemplate(folderTemplate);

      // Reset local template
      setLocalTemplate('');
      setLocalTemplateFile(null);
    }
  }, [folderTemplate]);

  useEffect(() => {
    // Set choosen local template as selected
    if (localTemplate) {
      // Set localTemplate to selected one
      setSelectedTemplate(localTemplate);

      // Reset selected template from folder
      setFolderTemplate('');

      // Get file to show in FileInput
      saveLocalTemplateFile(localTemplate);
    }
  }, [localTemplate]);

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title="Create config"
      size="sm"
      data-testid="config-create-modal"
    >
      <form onSubmit={form.onSubmit(handleSubmit, handleValidationError)}>
        <Stack gap={16}>
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
            <Stack gap={0}>
              <Select
                label="Template from folders"
                placeholder={`${!templateFilesData?.length ? 'No selected folder in preferences' : 'Select template from folders'}`}
                value={folderTemplate}
                data={templateFilesData}
                mx="2rem"
                onChange={handleSelectFolderTemplate}
                disabled={!templateFilesData?.length}
              />

              <Center mt={8}>
                <Text>or</Text>
              </Center>

              <FileInput
                clearable
                label="Local template"
                placeholder="Select local template"
                value={localTemplateFile ?? null}
                onClick={handleSelectLocalTemplate}
                onChange={(value) => {
                  if (value === null) {
                    setLocalTemplateFile(null);
                  }
                }}
                mx="2rem"
              />
            </Stack>
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
