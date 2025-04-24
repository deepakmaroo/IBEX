import { Table, ScrollArea } from '@mantine/core';

interface MatrixViewerProps {
  value: number[][];
}

export const MatrixViewer = ({ value }: MatrixViewerProps) => {
  return (
    <ScrollArea h={value.length > 5 ? 150 : 'auto'} maw={600}>
      <Table withTableBorder striped highlightOnHover>
        <Table.Tbody>
          {value.map((row, i) => (
            <Table.Tr key={i}>
              {row.map((val, j) => (
                <Table.Td key={j}>{val}</Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
};
