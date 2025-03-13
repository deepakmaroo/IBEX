// import {
//   Alert,
//   Autocomplete,
//   Button,
//   Fieldset,
//   Grid,
//   Group,
//   TextInput,
// } from '@mantine/core';
// import { useCallback, useEffect, useState } from 'react';
// import { IconInfoCircle, IconX } from '@tabler/icons-react';
// import { useIbexStore } from '../../../stores';
// import {
//   DataFormPlot,
//   CoordinatePlot,
//   Configuration,
// } from 'src/renderer/types';


// /**
//  * 
//  * 
//  * 
//  * *****************NOT USED*****************
//  * 
//  * 
//  */

// interface VisualizationPlotFormProps {
//   closeCustomPlotModal: () => void;
// }
// export const VisualizationPlotForm = ({
//   closeCustomPlotModal,
// }: VisualizationPlotFormProps) => {
//   const { active, updatedConfiguration } = useIbexStore();
//   const [totalCheckedNode, setTotalCheckedNode] = useState<string[]>([]);
//   const [dataFormPlot, setDataFormPlot] = useState<DataFormPlot>({});
//   const [selectableCheckedNode, setSelectableCheckedNode] = useState<string[]>(
//     [],
//   );
//   const [formPlotList, setFormPlotList] = useState<CoordinatePlot[]>([]);

//   function clearFormPlotAxe(id: number, field: string) {
//     const formPlotToUpdate = JSON.parse(JSON.stringify(formPlotList));
//     if (formPlotToUpdate[id]) {
//       field === 'axeY'
//         ? delete formPlotToUpdate[id].axeY
//         : field === 'axeX' && delete formPlotToUpdate[id].axeX;
//       setFormPlotList([...formPlotToUpdate]);
//     }
//   }

//   function updateFormPlot(id: number, field: string, value: string) {
//     const formPlotToUpdate = JSON.parse(JSON.stringify(formPlotList));
//     while (!formPlotToUpdate[id]) {
//       formPlotToUpdate.push({});
//     }
//     field === 'nameNode'
//       ? (formPlotToUpdate[id].nameNode = value)
//       : field === 'axeY'
//         ? (formPlotToUpdate[id].axeY = value)
//         : field === 'axeX' && (formPlotToUpdate[id].axeX = value);
//     setFormPlotList([...formPlotToUpdate]);
//   }

//   function updateTotalCheckedNode() {
//     if (active.checkedNodes) {
//       const tempTotalCheckedNode: string[] = [];
//       for (const activeNode of active.checkedNodes) {
//         tempTotalCheckedNode.push(...activeNode.checkedNodes);
//       }
//       setTotalCheckedNode(tempTotalCheckedNode);
//     }
//   }

//   function updateSelectableCheckedNode() {
//     let selectableCheckedNodeToUpdate: string[] = JSON.parse(
//       JSON.stringify(totalCheckedNode),
//     );
//     let index = 0;
//     for (const formPlot of formPlotList) {
//       if (formPlot.axeX || formPlot.axeY) {
//         // Remove axes already selected
//         selectableCheckedNodeToUpdate = selectableCheckedNodeToUpdate.filter(
//           (selectableAxe) =>
//             selectableAxe !== formPlot?.axeX &&
//             selectableAxe !== formPlot?.axeY,
//         );

//         // Clear axes unselected
//         if (formPlot.axeX && !totalCheckedNode.includes(formPlot.axeX)) {
//           clearFormPlotAxe(index, 'axeX');
//         }
//         if (formPlot.axeY && !totalCheckedNode.includes(formPlot.axeY)) {
//           clearFormPlotAxe(index, 'axeY');
//         }
//       }
//       index++;
//     }
//     setSelectableCheckedNode([...selectableCheckedNodeToUpdate]);
//   }

//   function checkDataFormPlotCompletion() {
//     let isIncomplete = true;
//     if (
//       dataFormPlot?.titleAxisX &&
//       dataFormPlot?.titleAxisY &&
//       dataFormPlot?.titleForm &&
//       formPlotList.length
//     ) {
//       for (const formPlot of formPlotList) {
//         if (formPlot?.nameNode && formPlot?.axeX && formPlot?.axeY) {
//           isIncomplete = false;
//           break;
//         }
//       }
//     }
//     return isIncomplete;
//   }

//   function updateDataFormPlot() {
//     const fromPlotListToSave: CoordinatePlot[] = [];
//     for (const formPlot of formPlotList) {
//       formPlot?.nameNode &&
//         formPlot?.axeX &&
//         formPlot?.axeY &&
//         fromPlotListToSave.push(formPlot);
//     }

//     const dataFormPlotUpdated: DataFormPlot = {
//       ...dataFormPlot,
//       coordinates: [...fromPlotListToSave],
//     };
//     const oldDataFormPlot = active.dataFormPlot;
//     const updatedActive: Configuration = {
//       ...active,
//       dataFormPlot: [...oldDataFormPlot, dataFormPlotUpdated],
//     };
//     updatedConfiguration(updatedActive);
//     closeCustomPlotModal();
//   }

//   const getPlotForms = useCallback(() => {
//     const formsProps: JSX.Element[] = [];
//     const spanCol = totalCheckedNode.length === 1 ? 12 : 6;

//     for (
//       let index = 0;
//       index < Math.ceil(totalCheckedNode.length / 2);
//       index++
//     ) {
//       formsProps.push(
//         <Grid.Col key={`plot_form_${index + 1}`} span={spanCol}>
//           <Fieldset legend={`Data ${index + 1}`}>
//             <TextInput
//               label="Node name"
//               placeholder="Enter plot name"
//               value={formPlotList[index]?.nameNode}
//               onChange={(event) =>
//                 updateFormPlot(index, 'nameNode', event.currentTarget.value)
//               }
//             />
//             <Autocomplete
//               label="Y Axis data"
//               placeholder="Select Y Axis data"
//               data={selectableCheckedNode}
//               rightSection={
//                 <Button
//                   p="0"
//                   onClick={() => clearFormPlotAxe(index, 'axeY')}
//                   variant="transparent"
//                 >
//                   <IconX color="gray" />
//                 </Button>
//               }
//               value={formPlotList[index]?.axeY ? formPlotList[index]?.axeY : ''}
//               onChange={(value) => updateFormPlot(index, 'axeY', value)}
//             />
//             <Autocomplete
//               label="X Axis data"
//               placeholder="Select X Axis data"
//               data={selectableCheckedNode}
//               rightSection={
//                 <Button
//                   p="0"
//                   onClick={() => clearFormPlotAxe(index, 'axeX')}
//                   variant="transparent"
//                 >
//                   <IconX color="gray" />
//                 </Button>
//               }
//               value={formPlotList[index]?.axeX ? formPlotList[index]?.axeX : ''}
//               onChange={(value) => updateFormPlot(index, 'axeX', value)}
//             />
//           </Fieldset>
//         </Grid.Col>,
//       );
//     }

//     return formsProps;
//   }, [selectableCheckedNode, formPlotList]);

//   useEffect(() => {
//     updateTotalCheckedNode();
//   }, [active]);

//   useEffect(() => {
//     // Update selectable axes when select/clear axes or check/uncheck data
//     updateSelectableCheckedNode();
//   }, [totalCheckedNode, formPlotList]);

//   return (
//     <Grid grow type="container">
//       {totalCheckedNode.length ? (
//         getPlotForms()
//       ) : (
//         <Alert
//           w="100%"
//           variant="light"
//           color="blue"
//           title="Select a path"
//           icon={<IconInfoCircle />}
//         >
//           Select minimun one path to generate the plot
//         </Alert>
//       )}
//       <Grid.Col span={12}>
//         <TextInput
//           label="Title"
//           placeholder="Enter title"
//           withAsterisk
//           disabled={!totalCheckedNode.length}
//           value={dataFormPlot?.titleForm}
//           onChange={(event) =>
//             setDataFormPlot((prevDataFormPlot) => ({
//               ...prevDataFormPlot,
//               titleForm: event.currentTarget.value,
//             }))
//           }
//         />
//       </Grid.Col>
//       <Grid.Col span={6}>
//         <TextInput
//           label="Y Axis name"
//           placeholder="Enter Y axis name"
//           withAsterisk
//           disabled={!totalCheckedNode.length}
//           value={dataFormPlot?.titleAxisY}
//           onChange={(event) =>
//             setDataFormPlot((prevDataFormPlot) => ({
//               ...prevDataFormPlot,
//               titleAxisY: event.currentTarget.value,
//             }))
//           }
//         />
//       </Grid.Col>
//       <Grid.Col span={6}>
//         <TextInput
//           label="X Axis name"
//           placeholder="Enter X axis name"
//           withAsterisk
//           disabled={!totalCheckedNode.length}
//           value={dataFormPlot?.titleAxisX}
//           onChange={(event) =>
//             setDataFormPlot((prevDataFormPlot) => ({
//               ...prevDataFormPlot,
//               titleAxisX: event.currentTarget.value,
//             }))
//           }
//         />
//       </Grid.Col>
//       <Grid.Col span={12}>
//         <Group justify="center" mt="2rem" align="flex-end">
//           <Button
//             onClick={() => updateDataFormPlot()}
//             disabled={checkDataFormPlotCompletion()}
//           >
//             Plot
//           </Button>
//         </Group>
//       </Grid.Col>
//     </Grid>
//   );
// };
