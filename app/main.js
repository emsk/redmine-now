'use strict';

(() => {
  const {app, BrowserWindow} = require('electron');
  const Config = require('electron-config');
  const config = new Config();

  const isMac = process.platform === 'darwin';

  let win = null;

  app.on('window-all-closed', () => {
    app.quit();
  });

  // Avoid the slow performance issue when renderer window is hidden
  app.commandLine.appendSwitch('disable-renderer-backgrounding');

  app.on('ready', () => {
    const winOptions = {
      title: 'Redmine Now',
      show: false,
      width: 850,
      height: 670,
      minWidth: 300,
      minHeight: 200,
      titleBarStyle: isMac ? 'hidden' : 'default'
    };
    Object.assign(winOptions, config.get('winBounds'));
    win = new BrowserWindow(winOptions);

    win.loadFile(`${__dirname}/index.html`);

    win.once('ready-to-show', () => {
      win.show();
    });

    win.on('close', () => {
      config.set('winBounds', win.getBounds());
    });

    win.on('closed', () => {
      win = null;
    });
  });
})();

