import { Group, Select, Stack, Switch, TextInput } from '@mantine/core';
import { DataGridPlot } from '../../../types';

interface CustomizeGlobalProps {
  customizedDataGrid: DataGridPlot;
  setCustomizedDataGrid: React.Dispatch<React.SetStateAction<DataGridPlot>>;
}
export const CustomizeGlobal = ({
  customizedDataGrid,
  setCustomizedDataGrid,
}: CustomizeGlobalProps) => {
  return (
    <Stack>
      <TextInput
        label="Title"
        description="Customize the title"
        placeholder="Enter the title"
        value={customizedDataGrid?.title || ''}
        onChange={(form) =>
          setCustomizedDataGrid({
            ...customizedDataGrid,
            title: form.currentTarget.value,
          })
        }
      />

      <Group>
        <Select
          label="Type of x axis"
          description="Customize the type of x axis"
          placeholder="Customize the type of x axis"
          data={['linear', 'log']}
          value={customizedDataGrid?.xAxisData?.type || 'linear'}
          onChange={(value) =>
            setCustomizedDataGrid({
              ...customizedDataGrid,
              xAxisData: { ...customizedDataGrid.xAxisData, type: value },
            })
          }
          maw={200}
        />
        <Select
          label="Type of y axis"
          description="Customize the type of y axis"
          placeholder="Customize the type of y axis"
          data={['linear', 'log']}
          value={customizedDataGrid?.yAxisData?.type || 'linear'}
          onChange={(value) =>
            setCustomizedDataGrid({
              ...customizedDataGrid,
              yAxisData: { ...customizedDataGrid.yAxisData, type: value },
            })
          }
          maw={200}
        />
        {customizedDataGrid?.y2AxisData && (
          <Select
            label="Type of y2 axis"
            description="Customize the type of y2 axis"
            placeholder="Customize the type of y2 axis"
            data={['linear', 'log']}
            value={customizedDataGrid?.y2AxisData?.type || 'linear'}
            onChange={(value) =>
              setCustomizedDataGrid({
                ...customizedDataGrid,
                y2AxisData: { ...customizedDataGrid.y2AxisData, type: value },
              })
            }
            maw={200}
          />
        )}
      </Group>

      <Switch
        label="Display the grid"
        checked={customizedDataGrid.displayGrid}
        onChange={(event) =>
          setCustomizedDataGrid({
            ...customizedDataGrid,
            displayGrid: event.currentTarget.checked,
          })
        }
      />
    </Stack>
  );
};
