// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

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
  getConfig: () => ipcRenderer.invoke('getConfig'),
};
// Use `contextBridge` APIs to expose the API to the renderer process

contextBridge.exposeInMainWorld('api', API);
