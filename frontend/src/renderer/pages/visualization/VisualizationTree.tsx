import { useCallback, useEffect } from 'react';
import { TreeLibrariesAccordion } from '../../components';
import { useIbexStore } from '../../stores';
import {
  CheckedNodeURI,
  Configuration,
  CustomTreeData,
  CustomTreeNodeData,
  NodeInfo,
  NodeInfoChildren,
  NodeInfoTypeEnum,
} from '../../types';

interface VisualizationTreeProps {
  height: string;
}

export const VisualizationTree = ({ height }: VisualizationTreeProps) => {
  const { active, setActive, updatedConfiguration } = useIbexStore();

  /**
   * Handle dataURI change
   */
  useEffect(() => {
    if (active && active.dataURI) {
  
      const existingCustomDataTree = active.customDataTree || [];
  
      const newCustomDataTree: CustomTreeData[] = active.dataURI.map((ids) => {
        const existingItem = existingCustomDataTree.find(item => item.uri === ids.uri);
        
        return {
          name: ids.name,
          uri: ids.uri,
          data: existingItem ? existingItem.data : [],
          uriColor: existingItem ? existingItem.uriColor : ids.uriColor,
        };
      });
  
      const updatedActive: Configuration = {
        ...active,
        customDataTree: newCustomDataTree,
      };
  
      updatedConfiguration(updatedActive);
      setActive(updatedActive.name);
    }
  }, [active.dataURI]);

  useEffect(() => {
    // Refresh expanded root folder when click on New Chart
    active?.lastURIInput && fetchNodeInfos(active.lastURIInput);
  }, [active.lastURIInput]);

  /**
   * Handle node update using full URI
   * @param fullUri The full URI for fetching or updating node data
   */
  const fetchNodeInfos = useCallback(
    async (nodeUri: string) => {
      if (!nodeUri) return;

      try {
        const responseNodeInfo = await fetch(
          `${window.env.API_URL}/ids_info/node_info/?uri=${encodeURIComponent(nodeUri)}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          },
        );

        if (!responseNodeInfo.ok) {
          const error = await responseNodeInfo.json();
          throw new Error(error.detail || 'Failed to fetch IDS data');
        }

        const nodeInfos: NodeInfo = await responseNodeInfo.json();
        const nodeInfoschildren = nodeInfos.children || [];

        if (nodeInfoschildren.length === 0) return;

        const newChildren: CustomTreeNodeData[] = nodeInfoschildren.map(
          (child: NodeInfoChildren) => {
            const newValue =
              nodeInfos.type === NodeInfoTypeEnum.ARRAY
                ? `${nodeUri}[0]/${child.name}`
                : `${nodeUri}/${child.name}`;
            return {
              label: child.name,
              value: newValue,
              type: child.type,
              children: [],
            };
          },
        );

        /**
         * Update the children of the node
         * @param nodes
         * @param nodeValueToUpdate
         * @returns
         */
        const updateNodeChildren = (
          dataTree: CustomTreeNodeData[],
          targetUri: string,
        ): CustomTreeNodeData[] => {
          // If the data tree is empty
          if (dataTree.length === 0) {
            return newChildren;
          }

          return dataTree.map((node) => {
            // If the node corresponds to the target, update its children
            if (node.value === targetUri) {
              return {
                ...node,
                children: newChildren,
              };
            }

            // If the node has children
            if (node.children.length > 0) {
              return {
                ...node,
                children: updateNodeChildren(node.children, targetUri),
              };
            }

            // Node no has children
            return node;
          });
        };

        const updatedCustomDataTree = active.customDataTree.map(
          (dataTree: CustomTreeData) => {
            if (dataTree.uri && nodeUri.startsWith(dataTree.uri)) {
              return {
                ...dataTree,
                data: updateNodeChildren(dataTree.data, nodeUri),
              };
            }
            return dataTree;
          },
        );

        const updatedActive: Configuration = {
          ...active,
          customDataTree: updatedCustomDataTree,
        };

        updatedConfiguration(updatedActive);
        setActive(updatedActive.name);
      } catch (error) {
        console.error(error);
      }
    },
    [active],
  );

  const fetchIDSData = useCallback(
    async (uri: string) => {
      try {
        const response = await fetch(
          `${window.env.API_URL}/data_entry/list_idses/?uri=${encodeURIComponent(uri)}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          },
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Failed to fetch IDS data');
        }

        const listIdsResult = await response.json();
        const newTree: CustomTreeNodeData[] = [];

        for (const ids of listIdsResult.idses) {
          for (const oc of ids.occurrences) {
            newTree.push({
              label: `${ids.name}:${oc}`,
              value: `${uri}#${ids.name}:${oc}`,
              type: NodeInfoTypeEnum.STRUCTURE,
              children: [],
            });
          }
        }

        const updatedActive: Configuration = {
          ...active,
          customDataTree: active.customDataTree.map((item) => {
            if (item.uri === uri) {
              return {
                ...item,
                data: newTree,
              };
            }
            return item;
          }),
        };

        updatedConfiguration(updatedActive);
      } catch (error) {
        console.error(error);
      }
    },
    [active],
  );

  /**
   * Handle accordion change
   * @param value
   * @returns
   */
  const handleAccordionChange = useCallback(
    (value: string) => {
      if (value) {
        const selectedCustomData = active.customDataTree.find(
          (item) => item.uri === value,
        );
        if (selectedCustomData) {
          if (selectedCustomData.data.length === 0) {
            fetchIDSData(selectedCustomData.uri);
          }
        }
      }
    },
    [active],
  );

  /**
   * Fetch children node infos
   * @param uri
   * @param nodeValue
   */
  const handleSelectChildren = useCallback(
    (nodeUri: string) => {
      fetchNodeInfos(nodeUri);
    },
    [active],
  );

  const getNodesChecked = useCallback(
    (uri: string, nodes: string[]) => {
      const updatedCheckedNodes: CheckedNodeURI[] = active.checkedNodes.map((checkedNode) => {
        if (checkedNode.uri === uri) {
          return {
            uri: uri,
            checkedNodes: nodes,
          };
        }
        return checkedNode;
      });
      const updatedActive: Configuration = {
        ...active,
        checkedNodes: updatedCheckedNodes,
      };
      updatedConfiguration(updatedActive);
      setActive(updatedActive.name);
    },
    [active],
  );

  return (
    <TreeLibrariesAccordion
      customDataTree={active.customDataTree}
      height={height}
      checkedNodes={active.checkedNodes || []}
      handleAccordionChange={handleAccordionChange}
      handleSelectChildren={handleSelectChildren}
      getNodesChecked={getNodesChecked}
    />
  );
};
