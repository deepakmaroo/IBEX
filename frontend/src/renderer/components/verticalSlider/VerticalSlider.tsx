import {
  ActionIcon,
  Flex,
  NumberFormatter,
  Text,
  Tooltip,
} from '@mantine/core';
import classes from './VerticalSlider.module.css';
import { useMove } from '@mantine/hooks';
import { IconAxisX, IconCircle } from '@tabler/icons-react';
import { useState, useEffect, useRef } from 'react';

interface VerticalSliderProps {
  name: string;
  valueIndex: number;
  data: string[] | number[];
  getValue: (index: number) => Promise<void>;
  switchAxis?: () => void;
  height?: number;
  disabled?: boolean;
}

export const VerticalSlider = ({
  name,
  valueIndex,
  data,
  getValue,
  switchAxis,
  height = 200,
  disabled = false,
}: VerticalSliderProps) => {
  const steps = data.length;
  const valueRatio = steps > 1 ? valueIndex / (steps - 1) : 1;
  const [isFocused, setIsFocused] = useState(false);
  const isLoadingRef = useRef(false);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  const move = useMove(async ({ y }) => {
    if (disabled || steps <= 1) return;
    const newIndex = Math.round((1 - y) * (steps - 1));
    const clampedIndex = Math.max(0, Math.min(newIndex, steps - 1));
    if (clampedIndex !== valueIndex) {
      // get value when not requesting dimensional data
      if (!isLoadingRef.current) {
        isLoadingRef.current = true;

        getValue(clampedIndex).finally(() => {
          isLoadingRef.current = false;
        });
      }
    }
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sliderRef.current &&
        !sliderRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isNumber = typeof data[valueIndex] === 'number';

  return (
    <Flex
      className={classes.verticalSliderContainer}
      justify="center"
      align="center"
      direction="column"
    >
      {switchAxis && (
        <Tooltip label={`Set ${name} to X axis`}>
          <ActionIcon onClick={switchAxis}>
            <IconAxisX />
          </ActionIcon>
        </Tooltip>
      )}

      <Tooltip label={name} position="right" withArrow>
        <Text ta="center" my="sm" w={50} fw="bold" truncate="end">
          {name}
        </Text>
      </Tooltip>
      <div
        ref={(node) => {
          if (node) {
            (
              move.ref as React.MutableRefObject<HTMLDivElement | null>
            ).current = node;
            sliderRef.current = node;
          }
        }}
        tabIndex={0}
        role="slider"
        aria-valuenow={valueIndex}
        aria-valuemin={0}
        aria-valuemax={steps - 1}
        onClick={(e) => {
          (e.currentTarget as HTMLDivElement).focus();
          setIsFocused(true);
        }}
        onKeyDown={(e) => {
          if (disabled || steps <= 1) return;

          if (e.key === 'ArrowUp') {
            const newIndex = Math.min(steps - 1, valueIndex + 1);
            getValue(newIndex);
            e.preventDefault();
          } else if (e.key === 'ArrowDown') {
            const newIndex = Math.max(0, valueIndex - 1);
            getValue(newIndex);
            e.preventDefault();
          }
        }}
        style={{
          outline: isFocused ? '2px solid var(--mantine-color-blue-6)' : 'none',
          margin: 'auto',
          width: 15,
          height,
          backgroundColor: disabled
            ? 'var(--mantine-color-gray-4)'
            : 'var(--mantine-color-gray-2)',
          position: 'relative',
          borderRadius: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            height: `${valueRatio * 100}%`,
            width: 15,
            backgroundColor: 'var(--mantine-color-blue-filled)',
            opacity: 0.7,
            borderRadius: '8px',
          }}
        />

        <Tooltip
          label={`Value: ${data[valueIndex]}`}
          position="right"
          withArrow
        >
          <IconCircle
            color="var(--mantine-color-blue-7)"
            width={22}
            height={22}
            fill="white"
            strokeWidth={6}
            style={{
              position: 'absolute',
              bottom: `calc(${valueRatio * 100}% - 8px)`,
              left: '-3px',
              pointerEvents: 'auto',
              zIndex: 2,
            }}
          />
        </Tooltip>
      </div>
      <Text ta="center" mt="xs" fw="bold">
        {isNumber ? (
          <NumberFormatter value={data[valueIndex]} decimalScale={2} />
        ) : (
          data[valueIndex]
        )}
      </Text>
    </Flex>
  );
};
