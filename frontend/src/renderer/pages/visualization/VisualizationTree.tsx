import { useEffect, useState } from 'react';
import { TreeLibrariesAccordion } from '../../components';
import { useIbexState } from '../../stores';
import { CustomTreeData, DataTreeSelected } from 'src/renderer/types';
import { TreeNodeData } from '@mantine/core';

interface VisualizationTreeProps {
  height: string;
}

export const VisualizationTree = ({ height }: VisualizationTreeProps) => {
  const { active } = useIbexState();
  const [customDataTree, setCustomDataTree] = useState<CustomTreeData[]>([]);

  useEffect(() => {
    if (active && active.dataIDS) {
      const newCustomDataTree: CustomTreeData[] = active.dataIDS.map((ids) => ({
        name: ids.name,
        uri: ids.uri,
        occurrences: ids.occurrences,
        data: [
          {
            label: ids.name,
            value: ids.name,
            children: [], // Les enfants seront ajoutés dynamiquement
          },
        ],
      }));
      setCustomDataTree(newCustomDataTree);
    }
  }, [active]);

  const getDataSelected = (data: DataTreeSelected) => {
    console.log(data);
  };

  return (
    <TreeLibrariesAccordion
      dataTree={customDataTree}
      getDataSelected={getDataSelected}
      height={height}
    />
  );
};

