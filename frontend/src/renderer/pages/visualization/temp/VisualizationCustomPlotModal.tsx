// import { Grid, Modal, Paper } from '@mantine/core';
// import { VisualizationTree } from '../VisualizationTree';
// import { VisualizationPlotForm } from './VisualizationPlotForm';
// /**
//  * 
//  * 
//  * 
//  * *****************NOT USED*****************
//  * 
//  * 
//  */
// interface VisualizationCustomPlotModalProps {
//   opened: boolean;
//   close: () => void;
// }

// export const VisualizationCustomPlotModal = ({
//   opened,
//   close,
// }: VisualizationCustomPlotModalProps) => {
//   const height = '85vh';

//   return (
//     <Modal
//       opened={opened}
//       onClose={close}
//       title="Select URIs"
//       size="95%"
//       centered
//     >
//       <Grid grow type="container">
//         <Grid.Col span={2}>
//           <Paper shadow="md" h="100%">
//             <VisualizationTree height={height} />
//           </Paper>
//         </Grid.Col>
//         <Grid.Col span={10}>
//           <Paper shadow="md" h="100%" p="1rem">
//             <VisualizationPlotForm closeCustomPlotModal={close} />
//           </Paper>
//         </Grid.Col>
//       </Grid>
//     </Modal>
//   );
// };
