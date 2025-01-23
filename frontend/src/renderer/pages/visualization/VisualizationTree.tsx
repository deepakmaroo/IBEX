import { useEffect, useState } from 'react';
import { TreeLibrariesAccordion } from '../../components';
import { useIbexState } from '../../stores';
import { CustomTreeData, DataTreeSelected } from 'src/renderer/types';

interface VisualizationTreeProps {
  height: string;
}

export const VisualizationTree = ({ height }: VisualizationTreeProps) => {
  const { active } = useIbexState();

  const [customDataTree, setCustomDataTree] = useState<CustomTreeData[]>([]);

  useEffect(() => {
    /**
     * Here we can load the data tree from backend api
     * and set the customDataTree state
     *
     * Actually we are using a temporary data from data.temp.ts
     */
    if (active && active.dataIDS) {
      const newCustomDataTree: CustomTreeData[] = [];

      

      // for (const ids of active.dataIDS) {
      //   const data = customData.find((d) => d.name === ids.name);
      //   if (data) {
      //     newCustomDataTree.push(data);
      //   }
      // }
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
