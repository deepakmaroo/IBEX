// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge } from 'electron';

export const API = {
  electron: {
    // Send a message to the main process
  },
};

contextBridge.exposeInMainWorld('api', API);
