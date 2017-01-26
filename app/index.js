'use strict';

(() => {
  const electron = require('electron');
  const remote = electron.remote;
  const app = remote.app;
  const BrowserWindow = remote.BrowserWindow;
  const dialog = remote.dialog;
  const shell = remote.shell;
  const Menu = remote.Menu;

  const appName = app.getName();
  const appCopyright = 'Copyright (c) 2016-2017 emsk';
  const appIconFilePath = `${__dirname}/images/redmine-now-icon.png`;

  const defaultUpdateIntervalSec = 600;

  class RedmineNow {
    constructor() {
      this._settings = {};
      this._startupTime = null;
      this._needsUpdateStatus = true;
      this._issueStatuses = [];
      this._timer = null;
      this._issues = [];
    }

    initMenu() {
      let appMenuItems = [
        {
          label: 'Edit',
          submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'selectall' }
          ]
        }
      ];

      const preferencesMenuItem = {
        label: 'Preferences...',
        accelerator: 'CmdOrCtrl+,',
        click: () => {
          this.openSettingsWindow();
        }
      };

      if (process.platform === 'darwin') {
        appMenuItems.unshift({
          label: app.getName(),
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            preferencesMenuItem,
            { type: 'separator' },
            { role: 'quit' }
          ]
        });
      } else {
        appMenuItems.unshift({
          label: 'File',
          submenu: [
            preferencesMenuItem,
            { type: 'separator' },
            { role: 'quit' }
          ]
        });

        appMenuItems.push({
          role: 'help',
          submenu: [
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

      const appMenu = Menu.buildFromTemplate(appMenuItems);
      Menu.setApplicationMenu(appMenu);

      return this;
    }

    initEventListener() {
      document.getElementById('show-hide-button').addEventListener('click', () => {
        this.toggleSettings();
      });

      remote.getCurrentWindow().on('close', () => {
        this.updateSettings();
      });

      return this;
    }

    openSettingsWindow() {
      let width = 540;
      let height = 185;
      if (process.platform !== 'darwin') {
        width = 555;
        height = 200;
      }

      const settingsWindow = new BrowserWindow({
        width: width,
        height: height,
        resizable: false,
        maximizable: false,
        parent: remote.getCurrentWindow()
      });

      if (process.platform !== 'darwin') {
        settingsWindow.setMenuBarVisibility(false);
      }

      settingsWindow.loadURL(`file://${__dirname}/settings.html`);

      settingsWindow.on('closed', () => {
        this._needsUpdateStatus = true;
        this.readStoredSettings()
          .displaySettings()
          .initFetch();
      });

      settingsWindow.webContents.on('did-finish-load', () => {
        settingsWindow.webContents.send('load-settings-window', this._startupTime);
      });
    }

    displayDefaultSettings() {
      document.getElementById('default-update-interval').innerHTML = defaultUpdateIntervalSec;

      this._startupTime = new Date();
      document.getElementById('base-time').value = this.formatDate(this._startupTime);

      return this;
    }

    fetchIssueStatus() {
      if (!this._needsUpdateStatus) {
        return this;
      }

      if (!this.validateSettings()) {
        return this;
      }

      const xhr = new XMLHttpRequest();

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          this.handleResponseFetchIssueStatus(xhr.status, xhr.responseText);
        }
      };

      this.updateLastExecutionTimeWithBaseTime();

      const url = document.getElementById('url').value;
      const apiKey = document.getElementById('api-key').value;
      xhr.open('GET', `${url}/issue_statuses.json`);
      xhr.setRequestHeader('X-Redmine-API-Key', apiKey);
      xhr.send();

      return this;
    }

    handleResponseFetchIssueStatus(status, responseText) {
      if (status === 200) {
        const headers = document.getElementById('headers');
        const container = document.getElementById('container');
        this._issueStatuses = JSON.parse(responseText).issue_statuses;

        this.clear();

        this._issueStatuses.forEach((issueStatus) => {
          const header = document.createElement('div');
          header.id = `header-column-status-${issueStatus.id}`;
          header.className = 'header-column';
          header.innerText = issueStatus.name;
          headers.appendChild(header);

          const column = document.createElement('div');
          column.id = `column-status-${issueStatus.id}`;
          column.className = 'column';
          container.appendChild(column);
        });

        this._needsUpdateStatus = false;
      }

      return this;
    }

    clear() {
      this._issues = [];
      document.getElementById('headers').innerHTML = '';
      document.getElementById('container').innerHTML = '';
    }

    initFetch() {
      const timer = () => {
        this.fetch(1);
        clearInterval(this._timer);
        this._timer = setInterval(timer, this.getUpdateIntervalMsec());
      };

      clearInterval(this._timer);
      this._timer = setInterval(timer, this.getUpdateIntervalMsec());

      return this;
    }

    getUpdateIntervalMsec() {
      return 1000 * (document.getElementById('update-interval').value || defaultUpdateIntervalSec);
    }

    fetch(page) {
      this.fetchIssueStatus();

      if (!this.validateSettings()) {
        return this;
      }

      const xhr = new XMLHttpRequest();

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          this.handleResponseFetch(xhr.status, xhr.responseText, page);
        }
      };

      const url = document.getElementById('url').value;
      const apiKey = document.getElementById('api-key').value;
      xhr.open('GET', `${url}/issues.json${this.getRequestParams(page)}`);
      xhr.setRequestHeader('X-Redmine-API-Key', apiKey);
      xhr.send();

      return this;
    }

    handleResponseFetch(status, responseText, page) {
      if (status === 200) {
        const response = JSON.parse(responseText);

        this.keepIssues(response.issues);

        if (this.calcRemainingRequestCount(response, page) > 0) {
          this.fetch(page + 1);
        } else {
          this.sortIssuesByUpdatedOn()
            .showIssues()
            .showTotalIssue()
            .updateLastExecutionTime();
        }
      }

      return this;
    }

    getRequestParams(page) {
      const lastExecutionTime = localStorage.getItem('lastExecutionTime');
      const params = [
        `updated_on=%3E%3D${lastExecutionTime}`,
        'status_id=*',
        'sort=updated_on:asc',
        'limit=100',
        `page=${page}`
      ];

      const projectId = document.getElementById('project-id').value;
      if (projectId !== '') {
        params.unshift(`project_id=${projectId}`);
      }

      return `?${params.join('&')}`;
    }

    calcRemainingRequestCount(response, page) {
      return Math.floor(response.total_count / response.limit) + 1 - page;
    }

    keepIssues(issues) {
      issues.forEach((issue) => {
        this.removeIssue(issue.id);
        this._issues.push(issue);
      });

      return this;
    }

    removeIssue(issueId) {
      this._issues = this._issues.filter((issue) => {
        return issue.id !== issueId;
      });

      return this;
    }

    sortIssuesByUpdatedOn() {
      this._issues.sort((a, b) => {
        const dateA = new Date(a.updated_on);
        const dateB = new Date(b.updated_on);
        return dateA - dateB || a.id - b.id;
      });

      return this;
    }

    showIssues() {
      const issueCount = this._issues.length;

      if (issueCount === 0) return this;

      const now = new Date();
      const todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const url = document.getElementById('url').value;

      this._issues.forEach((issue) => {
        const issueElementId = `issue-${issue.id}`;
        this.removeIssueElement(issueElementId);
        const issueElement = this.createIssueElement(issueElementId, issue, todayTime, url);
        const column = document.getElementById(`column-status-${issue.status.id}`);
        column.insertBefore(issueElement, column.firstChild);
      });

      return this;
    }

    removeIssueElement(issueElementId) {
      const issueElement = document.getElementById(issueElementId);
      if (issueElement) {
        issueElement.parentNode.removeChild(issueElement);
      }

      return this;
    }

    createIssueElement(issueElementId, issue, todayTime, url) {
      const issueElement = document.createElement('div');
      issueElement.id = issueElementId;
      issueElement.className = 'issue';

      const issueIdElement = document.createElement('div');
      issueIdElement.innerText = `#${issue.id}`;
      issueIdElement.className = 'issue-id';
      issueElement.appendChild(issueIdElement);

      const subjectElement = document.createElement('div');
      subjectElement.innerText = issue.subject;
      subjectElement.className = 'subject';
      issueElement.appendChild(subjectElement);

      const assignedTo = issue.assigned_to;
      if (assignedTo !== undefined) {
        const assignedToElement = document.createElement('div');
        assignedToElement.innerText = assignedTo.name;
        assignedToElement.className = 'assigned-to';
        issueElement.appendChild(assignedToElement);
      }

      const updatedOnElement = document.createElement('div');
      updatedOnElement.innerText = this.formatDate(new Date(issue.updated_on), todayTime);
      updatedOnElement.className = 'updated-on';
      issueElement.appendChild(updatedOnElement);

      issueElement.addEventListener('click', () => {
        shell.openExternal(`${url}/issues/${issue.id}`);
      });

      return issueElement;
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

    showTotalIssue() {
      const issueCount = this._issues.length;

      document.getElementById('total-issue-count').innerText = issueCount;

      const issueUnit = (issueCount === 0 || issueCount === 1) ? 'issue' : 'issues';
      document.getElementById('total-issue-unit').innerText = issueUnit;

      return this;
    }

    updateLastExecutionTime(date = new Date()) {
      const lastExecutionTime = date.toISOString().replace(/\.\d+Z$/, 'Z');
      localStorage.setItem('lastExecutionTime', lastExecutionTime);

      return this;
    }

    updateLastExecutionTimeWithBaseTime() {
      if (this._settings.baseTime !== undefined) {
        this.updateLastExecutionTime(new Date(this._settings.baseTime));
      }

      return this;
    }

    readStoredSettings() {
      this._settings = {
        url: localStorage.getItem('url'),
        apiKey: localStorage.getItem('apiKey'),
        projectId: localStorage.getItem('projectId'),
        updateInterval: localStorage.getItem('updateInterval'),
        baseTime: localStorage.getItem('baseTime')
      };

      return this;
    }

    displaySettings() {
      document.getElementById('url').value = localStorage.getItem('url');
      document.getElementById('api-key').value = localStorage.getItem('apiKey');
      document.getElementById('project-id').value = localStorage.getItem('projectId');
      document.getElementById('update-interval').value = localStorage.getItem('updateInterval');

      const baseTime = localStorage.getItem('baseTime');
      if (baseTime !== null) {
        document.getElementById('base-time').value = this.formatDate(new Date(baseTime));
      }

      return this;
    }

    updateSettings() {
      localStorage.removeItem('baseTime');
      localStorage.removeItem('baseTimeValue');

      return this;
    }

    toggleSettings() {
      const inputElements = Array.prototype.slice.call(document.getElementsByTagName('input'));
      const selectElements = Array.prototype.slice.call(document.getElementsByTagName('select'));
      const elements = inputElements.concat(selectElements);
      elements.forEach((element) => {
        element.classList.toggle('mask');
      });

      return this;
    }

    validateSettings() {
      const url = document.getElementById('url').value;
      const apiKey = document.getElementById('api-key').value;

      if (url === '' || apiKey === '') {
        return false;
      }

      return true;
    }
  }

  window.addEventListener('load', () => {
    const redmineNow = new RedmineNow();
    redmineNow.initMenu()
      .initEventListener()
      .displayDefaultSettings()
      .displaySettings()
      .fetchIssueStatus()
      .updateLastExecutionTime(this._startupTime)
      .initFetch();
  });
})();

