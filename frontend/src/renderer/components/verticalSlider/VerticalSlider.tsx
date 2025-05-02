import { Group, Text } from '@mantine/core';
import { useMove } from '@mantine/hooks';
import { IconCircle } from '@tabler/icons-react';

interface VerticalSliderProps {
  value: number;
  onChange: (value: number) => void;
  height?: number;
  disabled?: boolean;
}

export const VerticalSlider = ({
  value,
  onChange,
  height = 200,
  disabled = false,
}: VerticalSliderProps) => {
  const { ref } = useMove(
    ({ y }) => {
      if (!disabled) onChange(1 - y);
    },
  );

  return (
    <Group justify="center">
      <Group justify="center">
        <div
          ref={ref}
          style={{
            width: 15,
            height: height,
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
              height: `${value * 100}%`,
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
              bottom: `calc(${value * 100}% - 8px)`,
              left: '-3px',
            }}
          />
        </div>
      </Group>

      <Text ta="center" mt="sm">
        Value: {Math.round(value * 100)}
      </Text>
    </Group>
  );
};
