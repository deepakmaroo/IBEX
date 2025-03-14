import { useCallback, useEffect, useState } from 'react';
import { TreeLibrariesAccordion } from '../../components';
import { useIbexStore } from '../../stores';
import {
  Configuration,
  CustomTreeData,
  CustomTreeNodeData,
  NodeInfoResponse,
  NodeInfoChildrenResponse,
  NodeInfoTypeEnum,
  SearchNodeResponse,
} from '../../types';
import {
  ActionIcon,
  Container,
  Loader,
  Switch,
  TextInput,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';
import { fetchNodeInfos } from './utils';

interface VisualizationTreeProps {
  height: string;
}

interface FormSearchNode {
  node: string;
}

export const VisualizationTree = ({ height }: VisualizationTreeProps) => {
  const { active, setActive, updatedConfiguration } = useIbexStore();

  const [accordionSelected, setAccordionSelected] = useState<string | null>();
  const [searchNodeIsLoading, setSearchNodeIsLoading] =
    useState<boolean>(false);

  const formSearchNode = useForm<FormSearchNode>({
    initialValues: {
      node: '',
    },
  });

  /**
   * Handle dataURI change
   */
  useEffect(() => {
    if (active && active.dataURI) {
      const existingCustomDataTree = active.customDataTree || [];

      const newCustomDataTree: CustomTreeData[] = active.dataURI.map((ids) => {
        const existingItem = existingCustomDataTree.find(
          (item) => item.uri === ids.uri,
        );

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
  const fetchNodeTree = useCallback(
    async (nodeUri: string) => {
      if (!nodeUri) return;

      try {
        const nodeInfos: NodeInfoResponse = await fetchNodeInfos(nodeUri);
        const nodeInfoschildren = nodeInfos.children || [];

        if (nodeInfoschildren.length === 0) return;

        const newChildren: CustomTreeNodeData[] = nodeInfoschildren.map(
          (child: NodeInfoChildrenResponse) => {
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

  /**
   * Fetch IDS data
   * @param uri
   */
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
   * Fetch search node
   * @param value
   */
  const fetchSearchNode = async (uriWithIds: string, value: string) => {
    if (!value) return;

    try {
      const response = await fetch(
        `${window.env.API_URL}/ids_info/find_paths/?uri=${encodeURIComponent(uriWithIds)}&searched_node=${encodeURIComponent(value)}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch IDS data');
      }

      const customDataTree = active.customDataTree.find(
        (item) => item.uri === accordionSelected,
      );

      if (!customDataTree) return;
      const dataTree = customDataTree.data.find(
        (item) => item.value === uriWithIds,
      );
      console.log('dataTree ids', dataTree);

      const searchResults: SearchNodeResponse = await response.json();

      console.log('searchResults', searchResults.paths);

      // updatedConfiguration(updatedActive);
      // setActive(updatedActive.name);
    } catch (error) {
      console.error(error);
    }
  };

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
          setAccordionSelected(value);
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
   * @param nodeUri
   * @returns
   */
  const handleSelectChildren = useCallback(
    (nodeUri: string) => {
      fetchNodeTree(nodeUri);
    },
    [active],
  );

  /**
   * Handle search node
   */
  const handleSearchNode = useCallback(async () => {
    if (accordionSelected) {
      const listURIsWithIds = active.customDataTree
        .find((item) => item.uri === accordionSelected)
        ?.data.map((item) => item.value);

      setSearchNodeIsLoading(true);
      const start = new Date().getTime();
      for (const uriWithIds of listURIsWithIds) {
        await fetchSearchNode(uriWithIds, formSearchNode.values.node);
      }

      const end = new Date().getTime();
      console.log('Execution time: ' + (end - start) + 'ms');
      setSearchNodeIsLoading(false);
    } else {
      console.error('Accordion not selected');
      showNotification({
        title: 'Search node',
        message: 'Select an uri to search',
        color: 'red',
      });
    }
  }, [active, formSearchNode, accordionSelected]);

  /**
   * Get nodes checked
   * @param uri
   * @param nodes
   */
  const getNodesChecked = useCallback(
    ( nodes: string[]) => {
      const updatedActive: Configuration = {
        ...active,
        checkedNodeURI: nodes,
      };
      updatedConfiguration(updatedActive);
      setActive(updatedActive.name);
    },
    [active],
  );

  return (
    <Container fluid p={0}>
      <Container fluid pt={1}>
        <form
          onSubmit={formSearchNode.onSubmit(() => {
            handleSearchNode();
          })}
        >
          <TextInput
            mt="sm"
            label="Search node"
            placeholder="Enter node name"
            {...formSearchNode.getInputProps('node')}
            rightSection={
              searchNodeIsLoading ? (
                <Loader size="xs" />
              ) : (
                <ActionIcon
                  variant="filled"
                  aria-label="Search node"
                  component="button"
                  type="submit"
                >
                  <IconSearch
                    style={{ width: '70%', height: '70%' }}
                    stroke={1.5}
                  />
                </ActionIcon>
              )
            }
            disabled={searchNodeIsLoading}
          />
        </form>
        <Switch
          my="sm"
          label="See errors"
          labelPosition="left"
          styles={{
            labelWrapper: {
              width: '100%',
            },
          }}
        />
      </Container>
      <TreeLibrariesAccordion
        customDataTree={active.customDataTree}
        height={`calc(${height} - 113px)`}
        checkedNodes={active.checkedNodeURI || []}
        handleAccordionChange={handleAccordionChange}
        handleSelectChildren={handleSelectChildren}
        getNodesChecked={getNodesChecked}
      />
    </Container>
  );
};
