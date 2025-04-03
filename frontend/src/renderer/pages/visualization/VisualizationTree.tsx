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
  DataGridPlot,
  DataIdsResponse,
  PlotDataResponse,
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
import {
  buildTree,
  fetchDataIds,
  fetchDataPlot,
  fetchFieldValue,
  fetchFindPaths,
  fetchNodeInfos,
  generateNewPlot,
  plotData,
} from '../../utils';

interface VisualizationTreeProps {
  height: string;
}

interface FormSearchNode {
  node: string;
}

export const VisualizationTree = ({ height }: VisualizationTreeProps) => {
  const { active, updatedConfiguration } = useIbexStore();

  const [uriSelected, setUriSelected] = useState<string | null>();
  const [showErrorBars, setShowErrorBars] = useState<boolean>(false);
  const [nodeSelected, setNodeSelected] = useState<string | null>();
  const [searchNodeIsLoading, setSearchNodeIsLoading] =
    useState<boolean>(false);

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
            if (item.uri === uriSelected) {
              return {
                ...item,
                data: item.data.map((node) => ({
                  ...node,
                  children: [],
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
                  node.seeErrorBars !== showErrorBars
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
        const listIdsResult = await fetchDataIds(uri);
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
    uri: string,
    value: string,
    showErrorBars: boolean,
  ) => {
    if (!value) return;

    try {
      const searchResults: SearchNodeResponse = await fetchFindPaths(
        uri,
        value,
        showErrorBars,
      );

      const customDataTreeUri = active.customDataTree.find(
        (item) => item.uri === uri,
      ).data;

      const dataTree = buildTree(customDataTreeUri, uri, searchResults.paths);

      const updatedActive: Configuration = {
        ...active,
        customDataTree: active.customDataTree.map((item) => {
          if (item.uri === uri) {
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
          setUriSelected(value);
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
    [active, formSearchNode.values.node, uriSelected],
  );

  /**
   * Get nodes checked
   * @param uri
   * @param nodes
   */
  const getNodesChecked = async (nodes: string[]) => {
    let updatedActive: Configuration = { ...active, checkedNodeURI: nodes };
  
    try {
      const findDataPlot = updatedActive.dataPlot.find(plot => plot.i === updatedActive.plotEditableUuid);
  
      if (!findDataPlot) {
        return await handleNewPlot(nodes, updatedActive);
      }
  
      if (nodes.length === 0) {
        updatedActive.dataPlot = active.dataPlot.filter(plot => plot.i !== updatedActive.plotEditableUuid);
      } else {
        updatedActive = await handleExistingPlot(nodes, findDataPlot, updatedActive);
      }
    } catch (error) {
      console.error(error);
    } finally {
      console.log('check finally');
      updatedConfiguration(updatedActive);
    }
  };
  
  const handleNewPlot = async (nodes: string[], updatedActive: Configuration) => {
    const response = await fetchDataPlot(nodes[0]);
    if (!response || response.data.ndim !== 1) return;
  
    const newPlot = generateNewPlot(
      `${response.data.name}(${response.data.unit})`,
      `${response.data.coordinates[0].name}(${response.data.coordinates[0].unit})`,
      response.data.unit,
      response.data.unit
    );
  
    const updatedPlot = await plotData(
      `${response.data.name}(${response.data.unit})`,
      newPlot,
      response.data.coordinates[0].value,
      response.data.value[0],
      nodes[0],
      `${response.data.name}(${response.data.unit})`,
      response.data.unit
    );
  
    updatedActive.dataPlot.push(updatedPlot);
    updatedActive.plotEditableUuid = updatedPlot.i;
    updatedConfiguration(updatedActive);
  };
  
  const handleExistingPlot = async (nodes: string[], findDataPlot: DataGridPlot, updatedActive: Configuration) => {
    const dataPlotted = nodes.filter(node => !findDataPlot.plot.some(plot => plot.nodeUri === node));
  
    if (dataPlotted.length === 0) {
      return updateExistingPlots(nodes, findDataPlot, updatedActive);
    }
  
    for (const node of dataPlotted) {
      const response = await fetchDataPlot(node);
      if (!response || response.data.ndim !== 1) {
        showNotification({ title: 'Plot', message: 'Cannot plot data with more than one dimension', color: 'yellow' });
        updatedActive.checkedNodeURI = nodes.filter(n => n !== node);
        continue;
      }
  
      const unit = response.data.unit;
      const unitIsSame = findDataPlot.yUnit === unit || findDataPlot.y2Unit === unit;
      const title = `${findDataPlot.title}/ ${response.data.name}(${unit})`;
  
      if (unitIsSame) {
        const updatedPlot = await plotData(title, findDataPlot, response.data.coordinates[0].value, response.data.value[0], node, `${response.data.name}(${unit})`, unit);
        updatedActive.dataPlot = [...active.dataPlot.filter(plot => plot.i !== findDataPlot.i), updatedPlot];
      } else if (!findDataPlot.y2AxisName) {
        findDataPlot.y2AxisName = unit;
        const updatedPlot = await plotData(title, findDataPlot, response.data.coordinates[0].value, response.data.value[0], node, `${response.data.name}(${unit})`, unit, true);
        updatedActive.dataPlot = [...active.dataPlot.filter(plot => plot.i !== findDataPlot.i), updatedPlot];
      } else {
        showNotification({ title: 'Plot', message: 'Cannot plot data with more than one dimension', color: 'yellow' });
        updatedActive.checkedNodeURI = nodes.filter(n => n !== node);
      }
    }
    return updatedActive;
  };
  
  const updateExistingPlots = (nodes: string[], findDataPlot: DataGridPlot, updatedActive: Configuration) => {
    const plots = findDataPlot.plot.filter(plot => nodes.includes(plot.nodeUri));
    if (plots.every(plot => plot.unit === plots[0].unit)) {
      findDataPlot.y2AxisName = '';
    }
    findDataPlot.plot = plots;
    findDataPlot.title = plots.map(plot => plot.name).join('/');
    updatedActive.dataPlot = [...active.dataPlot.filter(plot => plot.i !== findDataPlot.i), findDataPlot];
    return updatedActive;
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
              handleSearchNode(showErrorBars);
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
