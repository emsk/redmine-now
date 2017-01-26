'use strict';

(() => {
  const electron = require('electron');
  const remote = electron.remote;
  const ipcRenderer = electron.ipcRenderer;

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
      remote.getCurrentWindow().on('close', () => {
        this.updateSettings()
          .updateLastExecutionTimeWithBaseTime();

        window.onbeforeunload = undefined;
        remote.getCurrentWindow().close();
      });

      return this;
    }

    displayDefaultSettings() {
      document.getElementById('default-update-interval').innerHTML = defaultUpdateIntervalSec;

      const select = document.getElementById('base-time');
      const option = document.createElement('option');
      option.value = -1;
      option.innerText = this.formatDate(this._startupTime);
      select.appendChild(option);

      for (let i = 0; i <= baseTimeDaysAgo; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const option = document.createElement('option');
        option.value = i;
        option.innerText = this.formatDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
        select.appendChild(option);
      }

      return this;
    }

    formatDate(date, todayTime = null) {
      const year = date.getFullYear();
      const month = `0${date.getMonth() + 1}`.slice(-2);
      const day = `0${date.getDate()}`.slice(-2);
      const hour = `0${date.getHours()}`.slice(-2);
      const minute = `0${date.getMinutes()}`.slice(-2);
      const dateTime = new Date(year, date.getMonth(), day).getTime();

      if (todayTime === dateTime) {
        return `${hour}:${minute}`;
      }
      return `${year}-${month}-${day} ${hour}:${minute}`;
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

  // Certainly save the settings
  window.onbeforeunload = (e) => {
    e.returnValue = false;
  };
})();

