import {
  CustomTreeNodeData,
  DataPlot,
  DataPlotly,
  FieldValueResponse,
  NodeInfoResponse,
  NodeInfoTypeEnum,
} from '../../types';

const generateUuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const fetchNodeInfos = async (
  nodeUri: string,
  showErrorBars: boolean,
): Promise<NodeInfoResponse> => {
  const response = await fetch(
    `${window.env.API_URL}/ids_info/node_info/?uri=${encodeURIComponent(nodeUri)}&show_error_bars=${showErrorBars}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch IDS data');
  }

  const data = await response.json();
  return data;
};

export const fetchFieldValue = async (
  uri: string,
): Promise<FieldValueResponse> => {
  try {
    const response = await fetch(
      `${window.env.API_URL}/data/field_value/?uri=${encodeURIComponent(uri)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch IDS data');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
};

export async function plotData(
  xData: number[],
  yData: number[],
  name: string,
  yAxisName: string,
  dataPlot: DataPlot[],
  uriY: string,
): Promise<DataPlot> {
  const plot: DataPlotly = {
    x: xData,
    y: yData,
    mode: 'lines',
    name: name,
    uriY: uriY,
  };

  let newUuid = generateUuid();

  while (dataPlot.find((plot) => plot.uuid === newUuid)) {
    newUuid = generateUuid();
  }

  const newDataPlot: DataPlot = {
    uuid: newUuid,
    static: false,
    plot: [plot],
    title: name,
    yAxisName: yAxisName,
  };

  return newDataPlot;
}

export const buildTree = (
  tree: CustomTreeNodeData[],
  idsUri: string,
  paths: string[],
): CustomTreeNodeData[] => {
  paths.forEach((path) => {
    const cleanPath = path.replace(/^#/, "").split("/");
    let currentNode = tree;
    let findValue = idsUri;

    cleanPath.forEach((segment, index) => {
      const isArray = segment.includes("[:]");
      const cleanSegment = segment.replace(/\[:\]/g, "[0]");
      const segmentLabel = isArray ? cleanSegment.replace(/\[0\]/g, "") : cleanSegment;

      // Get the value of the node
      findValue += index === 0 ? `#${cleanSegment}:0` : `/${cleanSegment}`;

      // Check if the node already exists
      let existingNode = currentNode.find((node) => node.value === findValue);

      if (!existingNode) {
        // Determine the type of the node
        let nodeType: NodeInfoTypeEnum;
        if (isArray) {
          nodeType = NodeInfoTypeEnum.ARRAY;
        } else if (index === cleanPath.length - 1) {
          nodeType = NodeInfoTypeEnum.FLOAT; 
        } else {
          nodeType = NodeInfoTypeEnum.STRUCTURE;
        }

        // Create the new node
        const newNode: CustomTreeNodeData = {
          label: segmentLabel,
          value: findValue,
          type: nodeType,
          children: [],
          seeErrorBars: false,
        };

        // Add the new node to the tree
        currentNode.push(newNode);
        existingNode = newNode;
      }

      // Move to the next node
      currentNode = existingNode.children;
    });
  });

  console.log("tree", tree);
  return tree;
};
