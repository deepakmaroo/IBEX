import { useEffect, useState } from 'react';
import { ActionIcon, FloatingIndicator, Group, Tabs } from '@mantine/core';
import classes from './TabsListCustom.module.css';
import { IconArrowLeft } from '@tabler/icons-react';

interface TabsListCustomProps {
  data: string[];
  value: string | null;
  handleSwitchGrid: () => void;
}

export const TabsListCustom = ({
  data,
  value,
  handleSwitchGrid,
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
      <ActionIcon
        variant="filled"
        aria-label="Metadatas"
        onClick={() => handleSwitchGrid()}
      >
        <IconArrowLeft style={{ width: '70%', height: '70%' }} stroke={1.5} />
      </ActionIcon>
      <Tabs.List
        ref={setRootRef}
        className={classes.list}
        styles={{
          list: {
            width: '95%',
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
