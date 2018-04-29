'use strict';

(() => {
  const util = require('./util');
  const electron = require('electron');
  const ipcRenderer = electron.ipcRenderer;
  const remote = electron.remote;

  const defaultUpdateIntervalSec = 600;

  class Setting {
    constructor(startupTime) {
      this._startupTime = startupTime;
    }

    initEventListener() {
      ipcRenderer.on('toggle-dark-mode', (event, isDarkMode) => {
        document.body.classList.toggle('dark', isDarkMode);
      });

      document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          remote.getCurrentWindow().close();
        }
      });

      document.getElementById('save-settings-button').addEventListener('click', () => {
        if (!this.validateSettings()) {
          return this;
        }

        this.updateSettings()
          .updateLastExecutionTimeWithBaseTime();
        remote.getCurrentWindow().getParentWindow().webContents.send('save-settings');
        remote.getCurrentWindow().close();
      });

      document.getElementById('cancel-settings-button').addEventListener('click', () => {
        remote.getCurrentWindow().close();
      });

      return this;
    }

    displayDefaultSettings() {
      document.getElementById('default-update-interval').innerHTML = defaultUpdateIntervalSec;
      document.getElementById('base-time').value = util.formatDatetimeLocalValue(this._startupTime);

      return this;
    }

    displaySettings() {
      document.getElementById('url').value = localStorage.getItem('url');
      document.getElementById('api-key').value = localStorage.getItem('apiKey');
      document.getElementById('project-id').value = localStorage.getItem('projectId');
      document.getElementById('update-interval').value = localStorage.getItem('updateInterval');

      const baseTimeValue = localStorage.getItem('baseTimeValue');
      if (baseTimeValue !== null) {
        document.getElementById('base-time').value = baseTimeValue;
      }

      return this;
    }

    validateSettings() {
      const baseTime = document.getElementById('base-time');

      if (baseTime.checkValidity()) {
        baseTime.classList.remove('invalid');
        return true;
      }

      baseTime.classList.add('invalid');
      return false;
    }

    updateSettings() {
      localStorage.setItem('url', document.getElementById('url').value);
      localStorage.setItem('apiKey', document.getElementById('api-key').value);
      localStorage.setItem('projectId', document.getElementById('project-id').value);
      localStorage.setItem('updateInterval', document.getElementById('update-interval').value);

      const baseTimeValue = document.getElementById('base-time').value;
      const date = new Date(baseTimeValue);
      const baseTime = date.toISOString().replace(/\.\d+Z$/, 'Z');
      localStorage.setItem('baseTime', baseTime);
      localStorage.setItem('baseTimeValue', baseTimeValue);

      return this;
    }

    updateLastExecutionTimeWithBaseTime() {
      const baseTimeValue = document.getElementById('base-time').value;
      const date = new Date(baseTimeValue);
      const baseTime = date.toISOString().replace(/\.\d+Z$/, 'Z');

      localStorage.setItem('lastExecutionTime', baseTime);

      return this;
    }
  }

  ipcRenderer.on('load-settings-window', (event, startupTime) => {
    const appStartupTime = new Date(startupTime);

    const setting = new Setting(appStartupTime);
    setting.initEventListener()
      .displayDefaultSettings()
      .displaySettings();
  });

  document.addEventListener('DOMContentLoaded', () => {
    const isDarkMode = JSON.parse(localStorage.getItem('isDarkMode'));
    document.body.classList.toggle('dark', isDarkMode);

    util.hideTitleBar();
  });
})();

