import { app, BrowserWindow, session } from 'electron';
import { createWindow } from './window';
import ipc from './ipc';
import { config } from 'dotenv';

config();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const isSquirrelStartup: boolean = require('electron-squirrel-startup');

if (isSquirrelStartup) {
  app.quit();
}

app.whenReady().then(() => {
  console.info('App is ready, environment:', process.env.NODE_ENV);
  createWindow();

  ipc.initialize();

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': '',
      },
    });
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
