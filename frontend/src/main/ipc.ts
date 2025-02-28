import { ipcMain } from 'electron';
import * as fs from 'fs';

export default {
  initialize() {
    ipcMain.handle('readFile', async (event, filePath: string) => {
      try {
        const fileContent: string = fs.readFileSync(filePath, 'utf-8');
        return fileContent;
      } catch (error) {
        throw new Error(`Failed to read file: ${error.message}`);
      }
    });

    ipcMain.handle('writeFile', (event, path, data) => {
      try {
        fs.writeFileSync(path, data);
        return true;
      } catch (error) {
        return false;
      }
    });

    ipcMain.handle('getFilePathDialog', async (event, type: string) => {
      const { dialog } = require('electron');
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
    });

    ipcMain.handle('saveAsDialog', async (event, name: string, ext: string) => {
      const { dialog } = require('electron');
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
  },
};
