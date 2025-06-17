import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs';
import { getConfigSync } from '../config';
import { ConfigurationState } from 'src/renderer/types';

export default {
  initialize() {
    const config = getConfigSync();

    ipcMain.handle(
      'readFile',
      async (event: Electron.IpcMainInvokeEvent, filePath: string) => {
        try {
          const fileContent: string = fs.readFileSync(filePath, 'utf-8');
          return fileContent;
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(`Failed to read file: ${error.message}`);
          } else {
            throw new Error(`Failed to read file: ${String(error)}`);
          }
        }
      },
    );

    ipcMain.handle('writeFile', (event, path, data) => {
      try {
        fs.writeFileSync(path, data);
        return true;
      } catch (error) {
        return false;
      }
    });

    ipcMain.handle(
      'getFilePathDialog',
      async (event: Electron.IpcMainInvokeEvent, type: string) => {
        const result = await dialog.showOpenDialog({
          properties: ['openFile'],
          filters: [
            { name: `${type.toLocaleUpperCase} File`, extensions: [type] },
          ],
        });
        if (!result.canceled && result.filePaths.length > 0) {
          return result.filePaths[0];
        }

        return null;
      },
    );

    ipcMain.handle('saveAsDialog', async (event, name: string, ext: string) => {
      if (process.env.E2E_TEST === 'true') {
        // For E2E tests, we save to a temporary file
        return `/tmp/${name}.${ext}`;
      }

      const result = await dialog.showSaveDialog({
        title: 'Save As',
        defaultPath: name,
        filters: [{ name: `${ext} files`, extensions: [ext] }],
      });
      if (!result.canceled && result.filePath) {
        return result.filePath;
      }

      return null;
    });

    ipcMain.handle('getConfig', async () => {
      return config;
    });

    ipcMain.handle(
      'setTestState',
      async (event, testState: Partial<ConfigurationState>) => {
        const win = BrowserWindow.getAllWindows()[0]; // ou autre moyen d'avoir ta fenêtre principale
        if (win) {
          win.webContents.send('updateTestState', testState);
          return true;
        }
        return false;
      },
    );

    ipcMain.handle('getTestState', async () => {
      const win = BrowserWindow.getAllWindows()[0];
      if (!win) return null;

      return new Promise<ConfigurationState>((resolve) => {
        const replyChannel = 'getTestState:reply';

        const listener = (
          _event: Electron.IpcMainEvent,
          state: ConfigurationState,
        ) => {
          ipcMain.removeListener(replyChannel, listener);
          resolve(state);
        };

        ipcMain.on(replyChannel, listener);
        win.webContents.send('getTestState', replyChannel);
      });
    });
  },
};
