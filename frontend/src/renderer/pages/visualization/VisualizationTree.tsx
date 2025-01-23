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

  const loadChildren = async (node: TreeNodeData): Promise<TreeNodeData[]> => {
    // Exemple de chargement de données enfants (remplacez par un appel API réel)
    console.log('Chargement des enfants pour le nœud :', node.label);

    return [
      { label: `${node.label} - Child 1`, value: `${node.value}-child1` },
      { label: `${node.label} - Child 2`, value: `${node.value}-child2` },
    ];
  };

  const getDataSelected = (data: DataTreeSelected) => {
    console.log(data);
  };

  return (
    <TreeLibrariesAccordion
      dataTree={customDataTree}
      getDataSelected={getDataSelected}
      height={height}
      loadChildren={loadChildren}
    />
  );
};

