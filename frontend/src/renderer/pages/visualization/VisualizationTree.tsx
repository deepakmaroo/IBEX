import { useCallback, useState } from 'react';
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
  URIData,
  URITreeNodeData,
} from '../../types';
import {
  ActionIcon,
  Avatar,
  Container,
  Fieldset,
  Group,
  Loader,
  ScrollArea,
  Switch,
  TextInput,
  Transition,
} from '@mantine/core';
import { IconChevronRight, IconSearch } from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { showNotification } from '@mantine/notifications';
import {
  buildTree,
  fetchDataIds,
  fetchFindPaths,
  fetchNodeInfos,
  handleExistingPlot,
  handleNewPlot,
} from '../../utils';

interface VisualizationTreeProps {
  height: string;
  extended?: boolean;
  handleExtended?: () => void;
}

interface FormSearchNode {
  node: string;
}

export const VisualizationTree = ({
  height,
  extended,
  handleExtended,
}: VisualizationTreeProps) => {
  const { active, updatedConfiguration } = useIbexStore();

  const [uriSelected, setUriSelected] = useState<URIData | null>();
  const [showErrorBars, setShowErrorBars] = useState<boolean>(false);
  const [nodeSelected, setNodeSelected] = useState<string | null>();
  const [searchNodeIsLoading, setSearchNodeIsLoading] =
    useState<boolean>(false);

  const heightFormatted = `calc(${height} - 155px)`;

  const formSearchNode = useForm<FormSearchNode>({
    initialValues: {
      node: '',
    },

    onValuesChange: (values) => {
      //If form.values.node is empty, reset active.customDataTree onchange input

      if (values.node === '') {
        const updatedActive: Configuration = {
          ...active,
          customDataTree: active.customDataTree.map((item) => {
            if (item.uri === uriSelected.uri) {
              return {
                ...item,
                data: item.data.map((node) => ({
                  ...node,
                  children: [] as CustomTreeNodeData[],
                  seeErrorBars: showErrorBars,
                })),
                expendAll: false,
              };
            }
            return item;
          }),
        };
        updatedConfiguration(updatedActive);
      }
    },
    validate: (values) => {
      if (values.node.length < 2) {
        return { node: 'Node name must have at least 2 characters' };
      }
    },
  });

  /**
   * Handle node update using full URI
   * @param fullUri The full URI for fetching or updating node data
   */
  const fetchNodeTree = useCallback(
    async (nodeUri: string, showErrorBars: boolean, searchNode: boolean) => {
      if (!nodeUri) return;
      if (searchNode) return;

      try {
        /**
         * Fetch children node infos
         * @param uri
         * @returns
         */

        const fetchChildrenNodeInfos = async (
          nodeInfoschildren: NodeInfoChildrenResponse[],
        ): Promise<CustomTreeNodeData[]> => {
          if (nodeInfoschildren.length === 0) return;

          const newChildren: CustomTreeNodeData[] = nodeInfoschildren.map(
            (child: NodeInfoChildrenResponse) => {
              const newValue =
                child.type === NodeInfoTypeEnum.ARRAY
                  ? `${nodeUri}${child.name}[:]/`
                  : child.type === NodeInfoTypeEnum.STRUCTURE
                    ? `${nodeUri}${child.name}/`
                    : `${nodeUri}${child.name}`;
              return {
                label: child.name,
                value: newValue,
                seeErrorBars: showErrorBars,
                type: child.type,
                children: [] as CustomTreeNodeData[],
                uriLabel: uriSelected.name,
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
            const nodeInfos: NodeInfoResponse = await fetchNodeInfos(
              targetUri.slice(0, -1),
              showErrorBars,
            );
            const nodeInfoschildren = nodeInfos.children || [];

            return await fetchChildrenNodeInfos(nodeInfoschildren);
          }

          return Promise.all(
            dataTree.map(async (node) => {
              if (node.value === targetUri) {
                if (
                  node.children.length === 0 ||
                  node.seeErrorBars !== showErrorBars
                ) {
                  /**
                   * Replace [:] and remove the last /
                   */
                  targetUri = targetUri.replace(/\[:\]/, '').slice(0, -1);

                  const nodeInfos: NodeInfoResponse = await fetchNodeInfos(
                    targetUri,
                    showErrorBars,
                  );
                  const nodeInfoschildren = nodeInfos.children || [];

                  const newChildren =
                    await fetchChildrenNodeInfos(nodeInfoschildren);

                  return {
                    ...node,
                    seeErrorBars: showErrorBars,
                    shape: nodeInfos.shape,
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
    async (dataUri: URIData) => {
      try {
        const listIdsResult = await fetchDataIds(dataUri.uri);
        const newTree: CustomTreeNodeData[] = [];

        for (const ids of listIdsResult.idses) {
          for (const oc of ids.occurrences) {
            newTree.push({
              label: `${ids.name}:${oc}`,
              value: `${dataUri.uri}#${ids.name}:${oc}/`,
              type: NodeInfoTypeEnum.STRUCTURE,
              children: [],
              seeErrorBars: showErrorBars,
              uriLabel: dataUri.name,
            });
          }
        }

        const updatedActive: Configuration = {
          ...active,
          customDataTree: active.customDataTree.map((item) => {
            if (item.uri === dataUri.uri) {
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
    dataUri: URIData,
    value: string,
    showErrorBars: boolean,
  ) => {
    if (!value) return;

    try {
      const searchResults: SearchNodeResponse = await fetchFindPaths(
        dataUri.uri,
        value,
        showErrorBars,
      );

      const customDataTreeUri = active.customDataTree.find(
        (item) => item.uri === dataUri.uri,
      ).data;

      const dataTree = buildTree(
        customDataTreeUri,
        dataUri,
        searchResults.paths,
      );

      const updatedActive: Configuration = {
        ...active,
        customDataTree: active.customDataTree.map((item) => {
          if (item.uri === dataUri.uri) {
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
        const selectedURIData = active.dataURI.find(
          (item) => item.uri === value,
        );
        if (selectedURIData) {
          setUriSelected(selectedURIData);
          fetchIDSData(selectedURIData);
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
      fetchNodeTree(nodeUri, showErrorBars, formSearchNode.values.node !== '');
      setNodeSelected(nodeUri);
    },
    [active, showErrorBars, formSearchNode.values.node, fetchNodeTree],
  );

  /**
   * Handles see error bars
   */
  const handleSeeErrorBars = useCallback(
    (value: boolean) => {
      setShowErrorBars(value);
      if (formSearchNode.values.node) {
        handleSearchNode(value);
      } else {
        fetchNodeTree(nodeSelected, value, false);
      }
    },
    [active, formSearchNode.values.node, uriSelected, nodeSelected],
  );

  /**
   * Handle search node
   */
  const handleSearchNode = useCallback(
    async (showErrors: boolean) => {
      if (uriSelected) {
        setSearchNodeIsLoading(true);

        await fetchSearchNode(
          uriSelected,
          formSearchNode.values.node,
          showErrors,
        );

        setSearchNodeIsLoading(false);
      } else {
        console.error('Accordion not selected');
        showNotification({
          title: 'Search node',
          message: 'Select an uri to search',
          color: 'red',
        });
      }
    },
    [active, formSearchNode.values.node],
  );

  /**
   * Get nodes checked
   * @param uri
   * @param nodes
   */
  const getNodesChecked = useCallback(
    async (nodes: URITreeNodeData[]) => {
      let updatedActive: Configuration = {
        ...active,
        saved: false,
        checkedNodeURI: [...nodes],
      };

      try {
        let findDataPlot = updatedActive.dataPlot.find(
          (plot) => plot.isEditing,
        );

        if (!findDataPlot) {
          updatedActive = await handleNewPlot(nodes, updatedActive);
          findDataPlot = updatedActive.dataPlot.find((plot) => plot.isEditing);
        } else {
          if (nodes.length === 0) {
            updatedActive.dataPlot = active.dataPlot.filter(
              (plot) => !plot.isEditing,
            );
          } else {
            updatedActive = await handleExistingPlot(
              nodes,
              findDataPlot,
              updatedActive,
            );
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        updatedConfiguration(updatedActive);
      }
    },
    [active, updatedConfiguration],
  );

  return (
    <Container fluid p={0}>
      <Group justify="end" mr="sm">
        <ActionIcon
          variant="filled"
          aria-label="Settings"
          onClick={handleExtended}
          style={{
            rotate: extended ? '180deg' : '0deg',
            transition: 'transform 0.3s ease',
          }}
        >
          <IconChevronRight
            style={{ width: '70%', height: '70%' }}
            stroke={1.5}
          />
        </ActionIcon>
      </Group>

      <Transition
        mounted={extended}
        transition="scale-x"
        duration={300}
        timingFunction="ease"
      >
        {(styles) => (
          <div style={styles}>
            <Container fluid p={0}>
              <Container fluid pt={1}>
                <Fieldset
                  variant="unstyled"
                  disabled={active.customDataTree.length === 0}
                >
                  <form
                    onSubmit={formSearchNode.onSubmit(() => {
                      handleSearchNode(showErrorBars);
                    })}
                  >
                    <TextInput
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
                    onChange={() => handleSeeErrorBars(!showErrorBars)}
                    styles={{
                      labelWrapper: {
                        width: '100%',
                      },
                    }}
                  />
                </Fieldset>
              </Container>
              <TreeLibrariesAccordion
                defaultValue={uriSelected?.uri}
                customDataTree={active.customDataTree}
                height={heightFormatted}
                checkedNodes={active.checkedNodeURI || []}
                handleAccordionChange={handleAccordionChange}
                handleSelectChildren={handleSelectChildren}
                getNodesChecked={getNodesChecked}
              />
            </Container>
          </div>
        )}
      </Transition>

      {!extended && (
        <ScrollArea h={heightFormatted}>
          <Group justify="center" mt="sm">
            {active?.customDataTree.map((item, index) => {
              return (
                <Avatar
                  key={`avatar-${index}-${item.uri}`}
                  color={item.uriColor}
                  radius="xl"
                  onClick={() => {
                    (handleExtended(), handleAccordionChange(item.uri));
                  }}
                >
                  {item.name.charAt(0).toUpperCase()}
                  {item.name.charAt(item.name.length - 1).toUpperCase()}
                </Avatar>
              );
            })}
          </Group>
        </ScrollArea>
      )}
    </Container>
  );
};
