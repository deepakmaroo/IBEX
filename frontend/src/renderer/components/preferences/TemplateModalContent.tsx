import classes from './TemplateModalContent.module.css';
import {
  ActionIcon,
  Button,
  Group,
  List,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { IconFolder, IconX } from '@tabler/icons-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { readIbexConfig, updateIbexConfig } from '../../utils';

// Delcare folder item component
interface FolderItemProps {
  folder: string;
  folderPathList: string[];
  setFolderPathList: React.Dispatch<React.SetStateAction<string[]>>;
}
function FolderItem({
  folder,
  folderPathList,
  setFolderPathList,
}: FolderItemProps) {
  const { ref, isTruncated } = useIsTruncated();

  function useIsTruncated() {
    const ref = useRef<HTMLParagraphElement>(null);
    const [isTruncated, setIsTruncated] = useState(false);

    useEffect(() => {
      const el = ref.current;
      if (!el) return;

      const observer = new ResizeObserver(() => {
        setIsTruncated(el.scrollWidth > el.clientWidth);
      });

      observer.observe(el);
      setIsTruncated(el.scrollWidth > el.clientWidth);

      return () => observer.disconnect();
    }, []);

    return { ref, isTruncated };
  }

  return (
    <List.Item w="100%">
      <Group justify="space-between" w="100%">
        <Tooltip label={folder} disabled={!isTruncated}>
          <Text ref={ref} maw={300} ta="left" truncate="start">
            {folder}
          </Text>
        </Tooltip>

        <ActionIcon
          variant="transparent"
          c="red"
          onClick={() => {
            setFolderPathList(folderPathList.filter((path) => path !== folder));
          }}
        >
          <IconX />
        </ActionIcon>
      </Group>
    </List.Item>
  );
}

interface TemplateModalContentProps {
  isSavingTemplatePreferences: boolean;
  setIsSavingTemplatePreferences: (value: boolean) => void;
  closeTemplateModal: () => void;
}
export function TemplateModalContent({
  isSavingTemplatePreferences,
  setIsSavingTemplatePreferences,
  closeTemplateModal,
}: TemplateModalContentProps) {
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [defaultConfig, setDefaultConfig] = useState<string>('');
  const [folderPathList, setFolderPathList] = useState<string[]>([]);

  const saveFoldersInConfig = useCallback(() => {
    setIsSavingTemplatePreferences(false);
    updateIbexConfig(defaultConfig, folderPathList);
    closeTemplateModal();
    showNotification({
      title: 'Template folders updated',
      message: `The default template folders has been updated.`,
      color: 'green',
    });
  }, [defaultConfig, folderPathList]);

  const handleSelectFolder = async () => {
    const path = await window.api.fs.selectFolder();
    if (path) setFolderPath(path);
  };

  const loadTemplateFolders = async function () {
    const userPreferences = await readIbexConfig();
    // Get default template folders
    if (userPreferences?.defaultConfigPath) {
      // Get defaultConfig to update config file
      setDefaultConfig(userPreferences.defaultConfigPath);
    }
    if (userPreferences?.templateFolders?.length > 0) {
      // Get templateFolders to show paths & update config file
      setFolderPathList(userPreferences.templateFolders);
    }
  };

  useEffect(() => {
    if (folderPath) {
      // Set folder path to the list if not already included
      if (!folderPathList.includes(folderPath)) {
        setFolderPathList([...folderPathList, folderPath]);
      }
      setFolderPath(null);
    }
  }, [folderPath]);

  useEffect(() => {
    // Read ibex config each time we open the modal to init the useStates needed for visualizing & updating ibex config
    loadTemplateFolders();
  }, []);

  useEffect(() => {
    // Save template folders in ibex config
    if (isSavingTemplatePreferences === true) {
      saveFoldersInConfig();
    }
  }, [isSavingTemplatePreferences]);

  return (
    <Stack>
      <Button onClick={handleSelectFolder} w="fit-content" m="auto">
        Add a folder
      </Button>
      {folderPathList?.length > 0 ? (
        <>
          <Text>Folder list:</Text>
          <List
            className={classes.list}
            spacing="xs"
            size="sm"
            w="100%"
            icon={
              <ThemeIcon variant="white" color="black" size={24}>
                <IconFolder size={16} />
              </ThemeIcon>
            }
          >
            {folderPathList?.map((folder) => (
              <FolderItem
                key={folder}
                folder={folder}
                folderPathList={folderPathList}
                setFolderPathList={setFolderPathList}
              />
            ))}
          </List>
        </>
      ) : (
        <Text ta="center">Folder list is empty</Text>
      )}
    </Stack>
  );
}
