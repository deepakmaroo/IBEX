import { Flex, Text } from '@mantine/core';
import { useMove } from '@mantine/hooks';
import { IconCircle } from '@tabler/icons-react';
import { useState, useEffect, useRef } from 'react';


interface VerticalSliderProps {
  name: string;
  index: number;
  data: string[] | number[];
  getValue: (index: number) => void;
  height?: number;
  disabled?: boolean;
}

export const VerticalSlider = ({
  name,
  index,
  data,
  getValue,
  height = 200,
  disabled = false,
}: VerticalSliderProps) => {
  const steps = data.length;
  const valueRatio = index / (steps - 1);
  const [isFocused, setIsFocused] = useState(false);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  const move = useMove(({ y }) => {
    if (disabled) return;
    const newIndex = Math.round((1 - y) * (steps - 1));
    const clampedIndex = Math.max(0, Math.min(newIndex, steps - 1));
    getValue(clampedIndex);
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

  useEffect(() => {
    console.log('data', data);
    console.log('index', index);
    console.log('valueRatio', valueRatio);
  }, [data, index, valueRatio]);

  return (
    <Flex justify="center" align="center" direction="column">
      <Text ta="center" my="sm" w={50} fw="bold">
        {name}
      </Text>
      <div
        ref={(node) => {
          if (node) {
            (move.ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
            sliderRef.current = node;
          }
        }}
        tabIndex={0}
        role="slider"
        aria-valuenow={index}
        aria-valuemin={0}
        aria-valuemax={steps - 1}
        onClick={(e) => {
          (e.currentTarget as HTMLDivElement).focus();
          setIsFocused(true);
        }}
        onKeyDown={(e) => {
          if (disabled) return;

          if (e.key === 'ArrowUp') {
            const newIndex = Math.min(steps - 1, index + 1);
            getValue(newIndex);
            e.preventDefault();
          } else if (e.key === 'ArrowDown') {
            const newIndex = Math.max(0, index - 1);
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
            border: 'solid 1px var(--mantine-color-blue-7)',
          }}
        />

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
          }}
        />
      </div>

      <Text ta="center" mt="sm" w={50}>
        {data[index]}
      </Text>
    </Flex>
  );
};
