import { useState } from 'react';
import { FloatingIndicator, Tabs } from '@mantine/core';
import classes from './TabsListCustom.module.css';

interface TabsListCustomProps {
  data: string[];
  value: string | null;
}

export const TabsListCustom = ({ data, value }: TabsListCustomProps) => {
  const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null);
  const [controlsRefs, setControlsRefs] = useState<
    Record<string, HTMLButtonElement | null>
  >({});
  const setControlRef = (val: string) => (node: HTMLButtonElement) => {
    controlsRefs[val] = node;
    setControlsRefs(controlsRefs);
  };

  return (
    <Tabs.List ref={setRootRef} className={classes.list}>
      {data.map((item, index) => (
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
  );
};
