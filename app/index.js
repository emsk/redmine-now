'use strict';

(() => {
  const electron = require('electron');
  const remote = electron.remote;
  const shell = remote.shell;
  const Menu = remote.Menu;
  const fs = require('fs');

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

      return `?${params.join('&')}`;
    }

    show(issues) {
      const issueCount = issues.length;

      if (issueCount === 0) return this;

      const newIssueColumn = document.getElementById('new-issue');
      const inProgressIssueColumn = document.getElementById('in-progress-issue');
      const url = document.getElementById('url').value;

      issues.forEach((issue) => {
        const boxId = `issue-${issue.id}`;
        const currentBox = document.getElementById(boxId);
        if (currentBox) {
          currentBox.parentNode.removeChild(currentBox);
        }

        const box = document.createElement('div');
        box.id = boxId;
        box.className = 'issue';
        box.innerText = `#${issue.id} ${issue.subject}`;
        box.addEventListener('click', () => {
          shell.openExternal(`${url}/issues/${issue.id}`);
        });

        const column = document.getElementById(`column-status-${issue.status.id}`);
        column.insertBefore(box, column.firstChild);
      });

      return this;
    }

    updateLastExecutionTime() {
      const lastExecutionTime = (new Date()).toISOString().replace(/\.\d+Z$/, 'Z');
      localStorage.setItem('lastExecutionTime', lastExecutionTime);
    }
  }

  window.addEventListener('load', () => {
    const redmineNow = new RedmineNow();
    redmineNow.initMenu()
      .initEventListener()
      .fetchIssueStatus()
      .updateLastExecutionTime();
  });
})();

