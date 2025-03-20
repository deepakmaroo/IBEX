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
  DataPlot,
} from '../../types';
import {
  ActionIcon,
  Container,
  Fieldset,
  Loader,
  Switch,
  TextInput,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';
import { buildTree, fetchFieldValue, fetchNodeInfos, plotData } from './utils';

interface VisualizationTreeProps {
  height: string;
}

interface FormSearchNode {
  node: string;
}

export const VisualizationTree = ({ height }: VisualizationTreeProps) => {
  const { active, updatedConfiguration } = useIbexStore();

  const [idsSelected, setIdsSelected] = useState<string | null>();
  const [showErrorBars, setShowErrorBars] = useState<boolean>(false);
  const [searchNodeIsLoading, setSearchNodeIsLoading] =
    useState<boolean>(false);
  const [buildTreeWithSearch, setBuildTreeWithSearch] =
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
          expendAll: false,
        };
      });

      const updatedActive: Configuration = {
        ...active,
        customDataTree: newCustomDataTree,
      };

      updatedConfiguration(updatedActive);
    }
  }, [active.dataURI]);

  /**
   * Handle node update using full URI
   * @param fullUri The full URI for fetching or updating node data
   */
  const fetchNodeTree = useCallback(
    async (
      nodeUri: string,
      showErrorBars: boolean,
      buildTreeWithSearch: boolean,
    ) => {
      if (!nodeUri) return;

      try {
        /**
         * Fetch children node infos
         * @param uri
         * @returns
         */

        const fetchChildrenNodeInfos = async (
          uri: string,
        ): Promise<CustomTreeNodeData[]> => {
          const nodeInfos: NodeInfoResponse = await fetchNodeInfos(
            uri.slice(0, -1),
            showErrorBars,
          );
          const nodeInfoschildren = nodeInfos.children || [];

          if (nodeInfoschildren.length === 0) return;

          const newChildren: CustomTreeNodeData[] = nodeInfoschildren.map(
            (child: NodeInfoChildrenResponse) => {
              const newValue =
                child.type === NodeInfoTypeEnum.ARRAY
                  ? `${nodeUri}${child.name}[0]/`
                  : child.type === NodeInfoTypeEnum.STRUCTURE
                    ? `${nodeUri}${child.name}/`
                    : `${nodeUri}${child.name}`;
              return {
                label: child.name,
                value: newValue,
                seeErrorBars: showErrorBars,
                type: child.type,
                children: [],
              };
            },
          );

          return newChildren;
        };

        /**
         * Update the children of the node
         * @param nodes
         * @param nodeValueToUpdate
         * @returns
         */
        const updateNodeChildren = async (
          dataTree: CustomTreeNodeData[],
          targetUri: string,
        ): Promise<CustomTreeNodeData[]> => {
          if (dataTree.length === 0) {
            return await fetchChildrenNodeInfos(targetUri);
          }

          return Promise.all(
            dataTree.map(async (node) => {
              if (node.value === targetUri) {
                if (
                  node.children.length === 0 ||
                  node.seeErrorBars !== showErrorBars ||
                  buildTreeWithSearch
                ) {
                  const newChildren = await fetchChildrenNodeInfos(targetUri);

                  return {
                    ...node,
                    seeErrorBars: showErrorBars,
                    children: newChildren,
                  };
                }
              }

              if (node.children.length > 0) {
                const updatedChildren = await updateNodeChildren(
                  node.children,
                  targetUri,
                );
                return {
                  ...node,
                  children: updatedChildren,
                };
              }

              return node;
            }),
          );
        };

        const updatedCustomDataTree: CustomTreeData[] = await Promise.all(
          active.customDataTree.map(async (dataTree: CustomTreeData) => {
            if (dataTree.uri && nodeUri.startsWith(dataTree.uri)) {
              const updatedData = await updateNodeChildren(
                dataTree.data,
                nodeUri,
              );
              return {
                ...dataTree,
                data: updatedData,
              };
            }
            return dataTree;
          }),
        );

        const updatedActive: Configuration = {
          ...active,
          customDataTree: updatedCustomDataTree,
        };

        updatedConfiguration(updatedActive);
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
              value: `${uri}#${ids.name}:${oc}/`,
              type: NodeInfoTypeEnum.STRUCTURE,
              children: [],
              seeErrorBars: showErrorBars,
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
  const fetchSearchNode = async (
    uriWithIds: string,
    value: string,
    showErrorBars: boolean,
  ) => {
    if (!value) return;

    try {
      const response = await fetch(
        `${window.env.API_URL}/ids_info/find_paths/?uri=${encodeURIComponent(uriWithIds)}&searched_node=${encodeURIComponent(value)}&show_error_bars=${showErrorBars}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to fetch IDS data');
      }

      const searchResults: SearchNodeResponse = await response.json();

      const uriSelected = uriWithIds.split('#')[0];
      const customDataTree = active.customDataTree.find(
        (item) => item.uri === uriSelected,
      ).data;

      const dataTree = buildTree(
        customDataTree,
        uriSelected,
        searchResults.paths,
      );

      const updatedActive: Configuration = {
        ...active,
        customDataTree: active.customDataTree.map((item) => {
          if (item.uri === uriSelected) {
            return {
              ...item,
              data: dataTree,
              expendAll: true,
            };
          }
          return item;
        }),
      };
      updatedConfiguration(updatedActive);
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
      const uriWithIds = nodeUri.split('/')[0];
      setIdsSelected(uriWithIds);

      fetchNodeTree(nodeUri, showErrorBars, buildTreeWithSearch);
    },
    [active, showErrorBars, buildTreeWithSearch],
  );

  /**
   * Handle search node
   */
  const handleSearchNode = useCallback(async () => {
    if (idsSelected) {
      setSearchNodeIsLoading(true);

      await fetchSearchNode(
        idsSelected,
        formSearchNode.values.node,
        showErrorBars,
      );

      setBuildTreeWithSearch(true);
      setSearchNodeIsLoading(false);
    } else {
      console.error('Accordion not selected');
      showNotification({
        title: 'Search node',
        message: 'Select an uri to search',
        color: 'red',
      });
    }
  }, [active, formSearchNode, idsSelected, showErrorBars]);

  /**
   * Get nodes checked
   * @param uri
   * @param nodes
   */
  const getNodesChecked = async (nodes: string[]) => {
    let updatedActive: Configuration = {
      ...active,
    };

    try {
      const findDataPlot = updatedActive.dataPlot.find(
        (plot) => plot.uuid === updatedActive.plotEditableUuid,
      );

      if (findDataPlot) {
        if (nodes.length === 0) {
          updatedActive = {
            ...active,
            dataPlot: active.dataPlot.filter(
              (plot) => plot.uuid !== updatedActive.plotEditableUuid,
            ),
            checkedNodeURI: [],
          };
        } else {
          //ToDo: Add data on exist plot
        }
      } else {
        // Add new plot

        for (const yUri of nodes) {
          const nodesInfos: NodeInfoResponse = await fetchNodeInfos(
            yUri,
            showErrorBars,
          );

          const uriWithIds = yUri.split('/')[0];
          const xAxisUri = `${uriWithIds}/${nodesInfos.coordinates[0]}`;

          const responseXAxis = await fetchFieldValue(xAxisUri);
          const responseYURI = await fetchFieldValue(yUri);

          if (responseXAxis && responseYURI) {
            const newPlot: DataPlot = await plotData(
              responseXAxis.value[0],
              responseYURI.value[0],
              nodesInfos.name,
              nodesInfos.name,
              active.dataPlot,
              yUri,
            );

            updatedActive = {
              ...active,
              plotEditableUuid: newPlot.uuid,
              dataPlot: [...active.dataPlot, newPlot],
              checkedNodeURI: nodes,
            };
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      updatedConfiguration(updatedActive);
    }
  };

  return (
    <Container fluid p={0}>
      <Container fluid pt={1}>
        <Fieldset
          variant="unstyled"
          disabled={active.customDataTree.length === 0}
        >
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
            checked={showErrorBars}
            onChange={() => setShowErrorBars((prev) => !prev)}
            styles={{
              labelWrapper: {
                width: '100%',
              },
            }}
          />
        </Fieldset>
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
