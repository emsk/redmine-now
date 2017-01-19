'use strict';

(() => {
  const electron = require('electron');
  const remote = electron.remote;
  const app = remote.app;
  const dialog = remote.dialog;
  const shell = remote.shell;
  const Menu = remote.Menu;

  const appName = app.getName();
  const appCopyright = 'Copyright (c) 2016-2017 emsk';
  const appIconFilePath = `${__dirname}/images/redmine-now-icon.png`;

  const defaultUpdateIntervalSec = 600;

  class RedmineNow {
    constructor() {
      this._startupTime = null;
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

      if (process.platform === 'darwin') {
        appMenuItems.unshift({
          label: app.getName(),
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'quit' }
          ]
        });
      } else {
        appMenuItems.unshift({
          label: 'File',
          submenu: [
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

      document.getElementById('update-interval').addEventListener('change', () => {
        this.initFetch();
      });

      document.getElementById('base-time').addEventListener('change', (event) => {
        const select = event.target;
        const baseTime = new Date(select.options[select.selectedIndex].text);
        this.updateLastExecutionTime(baseTime);
      });

      remote.getCurrentWindow().on('close', () => {
        this.updateSettings();
      });

      return this;
    }

    displayDefaultSettings() {
      document.getElementById('default-update-interval').innerHTML = defaultUpdateIntervalSec;

      this._startupTime = new Date();

      const select = document.getElementById('base-time');
      const option = document.createElement('option');
      option.value = -1;
      option.innerText = this.formatDate(this._startupTime);
      select.appendChild(option);

      for (let i = 0; i <= 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const option = document.createElement('option');
        option.value = i;
        option.innerText = this.formatDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
        select.appendChild(option);
      }

      return this;
    }

    fetchIssueStatus() {
      const xhr = new XMLHttpRequest();

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          this.handleResponseFetchIssueStatus(xhr.status, xhr.responseText);
        }
      };

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
      }

      return this;
    }

    initFetch() {
      const timer = () => {
        this.fetch();
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

    fetch() {
      if (this._issueStatuses.length === 0) {
        this.fetchIssueStatus();
      }

      const xhr = new XMLHttpRequest();

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          this.handleResponseFetch(xhr.status, xhr.responseText);
        }
      };

      const url = document.getElementById('url').value;
      const apiKey = document.getElementById('api-key').value;
      xhr.open('GET', `${url}/issues.json${this.getRequestParams()}`);
      xhr.setRequestHeader('X-Redmine-API-Key', apiKey);
      xhr.send();

      return this;
    }

    handleResponseFetch(status, responseText) {
      if (status === 200) {
        this.keepIssues(JSON.parse(responseText).issues)
          .sortIssuesByUpdatedOn()
          .showIssues()
          .showTotalIssue()
          .updateLastExecutionTime();
      }

      return this;
    }

    getRequestParams() {
      const lastExecutionTime = localStorage.getItem('lastExecutionTime');
      const params = [
        `updated_on=%3E%3D${lastExecutionTime}`,
        'status_id=*',
        'sort=updated_on:asc'
      ];

      const projectId = document.getElementById('project-id').value;
      if (projectId !== '') {
        params.unshift(`project_id=${projectId}`);
      }

      return `?${params.join('&')}`;
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
        return dateA - dateB;
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

    displaySettings() {
      document.getElementById('url').value = localStorage.getItem('url');
      document.getElementById('api-key').value = localStorage.getItem('apiKey');
      document.getElementById('project-id').value = localStorage.getItem('projectId');
      document.getElementById('update-interval').value = localStorage.getItem('updateInterval');

      return this;
    }

    updateSettings() {
      localStorage.setItem('url', document.getElementById('url').value);
      localStorage.setItem('apiKey', document.getElementById('api-key').value);
      localStorage.setItem('projectId', document.getElementById('project-id').value);
      localStorage.setItem('updateInterval', document.getElementById('update-interval').value);

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

