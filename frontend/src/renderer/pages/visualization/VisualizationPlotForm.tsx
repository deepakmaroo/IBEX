import { Alert, Autocomplete, Button, Fieldset, Grid, TextInput } from '@mantine/core';
import { useCallback, useEffect, useState } from 'react';
import { IconInfoCircle, IconX } from '@tabler/icons-react';
import { useIbexStore } from '../../stores';

interface FormPlot {
  nameNode?: string;
  axeX?: string;
  axeY?: string;
}

export const VisualizationPlotForm = () => {
  const { active } = useIbexStore();
  const [totalCheckedNode, setTotalCheckedNode] = useState<string[]>([]);
  const [formPlot, setFormPlot] = useState<FormPlot[]>([]);

  function updateTotalCheckedNode(){
    if(active.checkedNodes){
      const tempTotalCheckedNode: string[] = []
      for (const activeNode of active.checkedNodes) {
        tempTotalCheckedNode.push(...activeNode.checkedNodes)
      }
      setTotalCheckedNode(tempTotalCheckedNode)
    }
  }

  function clearFormPlotAxe(id: number, field: string){
    const formPlotToUpdate = JSON.parse(JSON.stringify(formPlot))
    if(formPlotToUpdate[id]){
      field === "axeY" ? (
        delete formPlotToUpdate[id].axeY
      ) : field === "axeX" && (
        delete formPlotToUpdate[id].axeX
      )
      setFormPlot([...formPlotToUpdate])
    }
  }

  function updateFormPlot(id: number, field: string, value: string){
    const formPlotToUpdate = JSON.parse(JSON.stringify(formPlot))
    if(!formPlotToUpdate[id]){
      formPlotToUpdate.push({})
    }
    field === "nameNode" ? (
      formPlotToUpdate[id].nameNode = value
    ) : field === "axeY" ? (
      formPlotToUpdate[id].axeY = value
    ) : field === "axeX" && (
      formPlotToUpdate[id].axeX = value
    )
    setFormPlot([...formPlotToUpdate])
  };

  const getPlotForms = useCallback(() => {
    const plotForm: JSX.Element[] = []
    const spanCol = totalCheckedNode.length === 1 ? (12) : (6)

    for (let index = 0; index < Math.ceil(totalCheckedNode.length / 2); index++) {
      plotForm.push(
        <Grid.Col key={`plot_form_${index + 1}`} span={spanCol}>
          <Fieldset legend={`Data ${index + 1}`}>
            <TextInput
              label="Node name"
              placeholder="Enter plot name"
              value={formPlot[index]?.nameNode}
              onChange={(event) => updateFormPlot(index, "nameNode", event.currentTarget.value)}
            />
            <Autocomplete
              label="Y Axis data"
              placeholder="Select Y Axis data"
              data={totalCheckedNode}
              rightSection={
                <Button p="0" onClick={() => clearFormPlotAxe(index, "axeY")} variant='transparent'><IconX color='gray'/></Button>
              }
              value={formPlot[index]?.axeY ? (formPlot[index]?.axeY) : ("")}
              onChange={(value) => updateFormPlot(index, "axeY", value)}
            />
            <Autocomplete
              label="X Axis data"
              placeholder="Select X Axis data"
              data={totalCheckedNode}
              rightSection={
                <Button p="0" onClick={() => clearFormPlotAxe(index, "axeX")} variant='transparent'><IconX color='gray'/></Button>
              }
              value={formPlot[index]?.axeX ? (formPlot[index]?.axeX) : ("")}
              onChange={(value) => updateFormPlot(index, "axeX", value)}
            />
          </Fieldset>
        </Grid.Col>
      )
    }

    return plotForm;
  }, [totalCheckedNode, formPlot]);

  useEffect(() => {
    updateTotalCheckedNode()
  }, [active])

  useEffect(() => {
    console.log("totalCheckedNode : ",totalCheckedNode);
  }, [totalCheckedNode])

  useEffect(() => {
    console.log("formPlot : ",formPlot);
  }, [formPlot])

  return (
    <Grid grow type="container">
      {(totalCheckedNode.length) ? (
        getPlotForms()
      ) : (
        <Alert variant="light" color="blue" title="Select a path" icon={<IconInfoCircle/>}>
          Select minimun one path to generate the plot
        </Alert>
      )}
      </Grid>
  );
};
