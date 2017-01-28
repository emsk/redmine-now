'use strict';

(() => {
  const util = require('./util');
  const electron = require('electron');
  const ipcRenderer = electron.ipcRenderer;
  const remote = electron.remote;

  const defaultUpdateIntervalSec = 600;
  const baseTimeDaysAgo = 14;

  ipcRenderer.on('load-settings-window', (event, startupTime) => {
    const appStartupTime = new Date(startupTime);

    const setting = new Setting(appStartupTime);
    setting.initEventListener()
      .displayDefaultSettings()
      .displaySettings();
  });

  class Setting {
    constructor(startupTime) {
      this._startupTime = startupTime;
    }

    initEventListener() {
      document.getElementById('save-settings-button').addEventListener('click', () => {
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

      const select = document.getElementById('base-time');
      const option = document.createElement('option');
      option.value = -1;
      option.innerText = util.formatDate(this._startupTime);
      select.appendChild(option);

      for (let i = 0; i <= baseTimeDaysAgo; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const option = document.createElement('option');
        option.value = i;
        option.innerText = util.formatDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
        select.appendChild(option);
      }

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

    updateSettings() {
      localStorage.setItem('url', document.getElementById('url').value);
      localStorage.setItem('apiKey', document.getElementById('api-key').value);
      localStorage.setItem('projectId', document.getElementById('project-id').value);
      localStorage.setItem('updateInterval', document.getElementById('update-interval').value);

      const selectedOption = this.getSelectedBaseTime();
      const date = new Date(selectedOption.text);
      const baseTime = date.toISOString().replace(/\.\d+Z$/, 'Z');
      localStorage.setItem('baseTime', baseTime);
      localStorage.setItem('baseTimeValue', selectedOption.value);

      return this;
    }

    updateLastExecutionTimeWithBaseTime() {
      const selectedOption = this.getSelectedBaseTime();
      const date = new Date(selectedOption.text);
      const baseTime = date.toISOString().replace(/\.\d+Z$/, 'Z');

      localStorage.setItem('lastExecutionTime', baseTime);

      return this;
    }

    getSelectedBaseTime() {
      const select = document.getElementById('base-time');
      return select.options[select.selectedIndex];
    }
  }
})();

