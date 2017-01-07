'use strict';

(() => {
  const electron = require('electron');
  const remote = electron.remote;
  const shell = remote.shell;
  const Menu = remote.Menu;

  class RedmineNow {
    constructor() {
      this._issueStatuses = [];
    }

    initMenu() {
      const appMenu = Menu.buildFromTemplate([
        {
          label: 'Edit',
          submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'selectall' },
            { type: 'separator' },
            { role: 'quit' }
          ]
        }
      ]);
      Menu.setApplicationMenu(appMenu);

      return this;
    }

    initEventListener() {
      document.getElementById('fetch-button').addEventListener('click', () => {
        this.fetch();
      });

      document.getElementById('show-hide-button').addEventListener('click', () => {
        this.toggleSettings();
      });

      remote.getCurrentWindow().on('close', () => {
        this.updateSettings();
      });

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
        this.show(JSON.parse(responseText).issues)
          .updateLastExecutionTime();
      }

      return this;
    }

    getRequestParams() {
      const lastExecutionTime = localStorage.getItem('lastExecutionTime');
      const params = [
        `updated_on=%3E%3D${lastExecutionTime}`,
        'status_id=*',
        'sort=updated_on:desc'
      ];

      const projectId = document.getElementById('project-id').value;
      if (projectId !== '') {
        params.unshift(`project_id=${projectId}`);
      }

      return `?${params.join('&')}`;
    }

    show(issues) {
      const issueCount = issues.length;

      if (issueCount === 0) return this;

      const url = document.getElementById('url').value;

      issues.forEach((issue) => {
        const issueElementId = `issue-${issue.id}`;
        this.removeIssueElement(issueElementId);
        const issueElement = this.createIssueElement(issueElementId, issue, url);
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

    createIssueElement(issueElementId, issue, url) {
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

      const authorElement = document.createElement('div');
      authorElement.innerText = issue.author.name;
      authorElement.className = 'author';
      issueElement.appendChild(authorElement);

      issueElement.addEventListener('click', () => {
        shell.openExternal(`${url}/issues/${issue.id}`);
      });

      return issueElement;
    }

    updateLastExecutionTime() {
      const lastExecutionTime = (new Date()).toISOString().replace(/\.\d+Z$/, 'Z');
      localStorage.setItem('lastExecutionTime', lastExecutionTime);

      return this;
    }

    displaySettings() {
      document.getElementById('url').value = localStorage.getItem('url');
      document.getElementById('api-key').value = localStorage.getItem('apiKey');
      document.getElementById('project-id').value = localStorage.getItem('projectId');

      return this;
    }

    updateSettings() {
      localStorage.setItem('url', document.getElementById('url').value);
      localStorage.setItem('apiKey', document.getElementById('api-key').value);
      localStorage.setItem('projectId', document.getElementById('project-id').value);

      return this;
    }

    toggleSettings() {
      const elements = Array.prototype.slice.call(document.getElementsByTagName('input'));
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
      .displaySettings()
      .fetchIssueStatus()
      .updateLastExecutionTime();
  });
})();

