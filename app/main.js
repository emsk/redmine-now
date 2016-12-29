'use strict';

(() => {
  const electron = require('electron');
  const app = electron.app;
  const BrowserWindow = electron.BrowserWindow;
  let win = null;

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // Avoid the slow performance issue when renderer window is hidden
  app.commandLine.appendSwitch('disable-renderer-backgrounding');

  app.on('ready', () => {
    win = new BrowserWindow({
      width: 600,
      height: 600
    });

    win.loadURL(`file://${__dirname}/index.html`);

    win.on('closed', () => {
      win = null;
    });
  });
})();

