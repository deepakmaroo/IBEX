// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { ENV_VARIABLE } from './config';

export const API = {
  fs: {
    readFile: (filePath: string) => ipcRenderer.invoke('readFile', filePath),

    writeFile: (path: string, data: string) =>
      ipcRenderer.invoke('writeFile', path, data),

    getFilePathDialog: (type: string) =>
      ipcRenderer.invoke('getFilePathDialog', type),

    saveAsDialog: (name: string, ext: string) =>
      ipcRenderer.invoke('saveAsDialog', name, ext),
  },
};

export const ENV = {
  API_URL: ENV_VARIABLE.API_URL,
};

contextBridge.exposeInMainWorld('api', API);
contextBridge.exposeInMainWorld('env', ENV);
