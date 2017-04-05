'use strict';

const electron = require('electron');

const remote = electron.remote;
const app = remote.app;
const dialog = remote.dialog;
const shell = remote.shell;
const Menu = remote.Menu;

const isMac = process.platform === 'darwin';

const appName = app.getName();
const appWebsite = 'https://github.com/emsk/redmine-now';
const appCopyright = 'Copyright (c) 2016-2017 emsk';
const appIconFilePath = `${__dirname}/images/redmine-now-icon.png`;

const sendAction = action => {
  remote.getCurrentWindow().webContents.send(action);
};

const appMenuItems = [
  {
    label: 'Edit',
    submenu: [
      {role: 'undo'},
      {role: 'redo'},
      {type: 'separator'},
      {role: 'cut'},
      {role: 'copy'},
      {role: 'paste'},
      {role: 'selectall'}
    ]
  },
  {
    role: 'window',
    submenu: [
      {role: 'minimize'},
      {role: 'zoom'},
      {type: 'separator'},
      {role: 'front'},
      {role: 'togglefullscreen'}
    ]
  }
];

const preferencesMenuItem = {
  label: 'Preferences...',
  accelerator: 'CmdOrCtrl+,',
  click: () => {
    sendAction('open-settings-window');
  }
};

const toggleDarkModeMenuItem = {
  label: 'Toggle Dark Mode',
  accelerator: 'CmdOrCtrl+Shift+D',
  click: () => {
    sendAction('toggle-dark-mode');
  }
};

const websiteMenuItem = {
  label: `${appName} Website`,
  click: () => {
    shell.openExternal(appWebsite);
  }
};

if (isMac) {
  appMenuItems.unshift({
    label: app.getName(),
    submenu: [
      {role: 'about'},
      {type: 'separator'},
      preferencesMenuItem,
      {type: 'separator'},
      toggleDarkModeMenuItem,
      {type: 'separator'},
      {role: 'quit'}
    ]
  });

  appMenuItems.push({
    role: 'help',
    submenu: [
      websiteMenuItem
    ]
  });
} else {
  appMenuItems.unshift({
    label: 'File',
    submenu: [
      preferencesMenuItem,
      {type: 'separator'},
      toggleDarkModeMenuItem,
      {type: 'separator'},
      {role: 'quit'}
    ]
  });

  appMenuItems.push({
    role: 'help',
    submenu: [
      websiteMenuItem,
      {type: 'separator'},
      {
        label: `About ${appName}`,
        click: () => {
          dialog.showMessageBox({
            title: `About ${appName}`,
            message: `${appName} ${app.getVersion()}`,
            detail: appCopyright,
            icon: appIconFilePath,
            buttons: []
          });
        }
      }
    ]
  });
}

module.exports = Menu.buildFromTemplate(appMenuItems);

