import { Group, Text } from '@mantine/core';
import { useMove } from '@mantine/hooks';
import { IconCircle } from '@tabler/icons-react';

interface VerticalSliderProps {
  value: number;
  data: number[];
  onChange: (value: number) => void;
  height?: number;
  disabled?: boolean;
}

export const VerticalSlider = ({
  value,
  data = [1, 5, 2, 3, 4, 6, 7, 8, 9, 10],
  onChange,
  height = 200,
  disabled = false,
}: VerticalSliderProps) => {
  const steps = data.length;
  const currentIndex = data.findIndex((d) => d === value);
  const valueRatio = currentIndex / (steps - 1); // entre 0 et 1

  const { ref } = useMove(({ y }) => {
    if (disabled) return;

    const index = Math.round((1 - y) * (steps - 1));
    const clampedIndex = Math.max(0, Math.min(index, steps - 1));
    onChange(data[clampedIndex]);
  });

  return (
    <Group justify="center">
      <Group justify="center">
        <div
          ref={ref}
          style={{
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
          {/* Filled bar */}
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

          {/* Thumb */}
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
      </Group>

      <Text ta="center" mt="sm">
        Value: {value}
      </Text>
    </Group>
  );
};
