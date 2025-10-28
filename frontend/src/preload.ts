// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { ConfigurationState } from './renderer/types';

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

    getHomePath: async () => await ipcRenderer.invoke('getHomePath'),
  },
  getConfig: () => ipcRenderer.invoke('getConfig'),

  setTestState: (testState: Partial<ConfigurationState>) =>
    ipcRenderer.invoke('setTestState', testState),

  getTestState: () => ipcRenderer.invoke('getTestState'),

  onUpdateTestState: (
    callback: (
      event: Electron.IpcRendererEvent,
      state: Partial<ConfigurationState>,
    ) => void,
  ) => {
    ipcRenderer.on('updateTestState', callback);
  },

  removeUpdateTestStateListener: (
    callback: (
      event: Electron.IpcRendererEvent,
      state: Partial<ConfigurationState>,
    ) => void,
  ) => {
    ipcRenderer.removeListener('updateTestState', callback);
  },

  on: ipcRenderer.on.bind(ipcRenderer),
  send: ipcRenderer.send.bind(ipcRenderer),
  removeListener: ipcRenderer.removeListener.bind(ipcRenderer),
};
// Use `contextBridge` APIs to expose the API to the renderer process

contextBridge.exposeInMainWorld('api', API);
