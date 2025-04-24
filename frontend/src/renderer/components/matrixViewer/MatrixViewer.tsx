import {
  Table,
  ScrollArea,
} from "@mantine/core";
import { isMatrix } from "src/renderer/utils";

interface MatrixViewerProps {
  value: number[] | number[][];
}

export const MatrixViewer= ({ value }: MatrixViewerProps) => {

  // détection 1D vs 2D
  const rows = isMatrix(value) ? value : [value];

  return (

      <ScrollArea>
        <Table withTableBorder striped highlightOnHover>
          <Table.Tbody>
            {rows.map((row, i) => (
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