// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge } from 'electron';
import { ENV_VARIABLE } from './config';

export const API = {
  electron: {
    // Send a message to the main process
  },
};

export const ENV = {
  API_PORT: ENV_VARIABLE.API_PORT,
  API_HOST: ENV_VARIABLE.API_HOST,
};

contextBridge.exposeInMainWorld('api', API);
contextBridge.exposeInMainWorld('env', ENV);
