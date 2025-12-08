import { useState } from 'react';
import {
  ActionIcon,
  FloatingIndicator,
  Group,
  Tabs,
  Tooltip,
} from '@mantine/core';
import classes from './TabsListCustom.module.css';
import { IconArrowLeft, IconCheck, IconX } from '@tabler/icons-react';

interface TabsListCustomProps {
  data: string[];
  value: string | null;
  usedFor: 'metadatas' | 'personalization';
  closeWithoutSaving: () => void;
  saveAndClose?: () => void;
}

export const TabsListCustom = ({
  data,
  value,
  usedFor,
  closeWithoutSaving,
  saveAndClose,
}: TabsListCustomProps) => {
  const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null);
  const [controlsRefs, setControlsRefs] = useState<
    Record<string, HTMLButtonElement | null>
  >({});
  const setControlRef = (val: string) => (node: HTMLButtonElement) => {
    controlsRefs[val] = node;
    setControlsRefs(controlsRefs);
  };

  return (
    <Group mt={2}>
      {usedFor === 'metadatas' ? (
        <ActionIcon
          variant="filled"
          aria-label="Metadatas"
          onClick={() => closeWithoutSaving()}
        >
          <IconArrowLeft style={{ width: '70%', height: '70%' }} stroke={1.5} />
        </ActionIcon>
      ) : (
        <>
          {saveAndClose && (
            <Tooltip label="Save customization and close">
              <ActionIcon
                variant="filled"
                aria-label="Metadatas"
                color="green"
                onClick={() => saveAndClose()}
              >
                <IconCheck
                  style={{ width: '70%', height: '70%' }}
                  stroke={1.5}
                />
              </ActionIcon>
            </Tooltip>
          )}
          <Tooltip label="Cancel customization">
            <ActionIcon
              variant="filled"
              aria-label="Metadatas"
              color="red"
              onClick={() => closeWithoutSaving()}
            >
              <IconX style={{ width: '70%', height: '70%' }} />
            </ActionIcon>
          </Tooltip>
        </>
      )}
      <Tabs.List
        ref={setRootRef}
        className={classes.list}
        styles={{
          list: {
            width: usedFor === 'metadatas' ? '95%' : '90%',
          },
        }}
      >
        {data.length > 0 &&
          data.map((item, index) => (
            <Tabs.Tab
              key={index}
              value={item}
              ref={setControlRef(item)}
              className={classes.tab}
            >
              {item}
            </Tabs.Tab>
          ))}

        <FloatingIndicator
          target={value ? controlsRefs[value] : null}
          parent={rootRef}
          className={classes.indicator}
        />
      </Tabs.List>
    </Group>
  );
};
