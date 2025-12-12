import { TextInput } from '@mantine/core';
import { DataGridPlot } from '../../../types';

interface CustomizeTitleProps {
  customizedDataGrid: DataGridPlot;
  setCustomizedDataGrid: React.Dispatch<React.SetStateAction<DataGridPlot>>;
}
export const CustomizeTitle = ({
  customizedDataGrid,
  setCustomizedDataGrid,
}: CustomizeTitleProps) => {
  return (
    <TextInput
      label="Plot title"
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
  );
};
