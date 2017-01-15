'use strict';

(() => {
  const electron = require('electron');
  const app = electron.app;
  const BrowserWindow = electron.BrowserWindow;
  const Config = require('electron-config');
  const config = new Config();
  let win = null;

  app.on('window-all-closed', () => {
    app.quit();
  });

  // Avoid the slow performance issue when renderer window is hidden
  app.commandLine.appendSwitch('disable-renderer-backgrounding');

  app.on('ready', () => {
    let winOptions = {
      width: 850,
      height: 625
    };
    Object.assign(winOptions, config.get('winBounds'));
    win = new BrowserWindow(winOptions);

    win.loadURL(`file://${__dirname}/index.html`);

    win.on('close', () => {
      config.set('winBounds', win.getBounds());
    });

    win.on('closed', () => {
      win = null;
    });
  });
})();

