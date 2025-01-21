// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge } from 'electron';

export const API = {
  electron: {
    // Send a message to the main process
  },
};

export const ENV = {
  API_PORT: process.env.API_PORT,
};

contextBridge.exposeInMainWorld('api', API);
contextBridge.exposeInMainWorld('env', ENV);
