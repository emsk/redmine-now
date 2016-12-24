'use strict';

(() => {
  const electron = require('electron');
  const remote = electron.remote;
  const shell = remote.shell;
  const fs = require('fs');

  class RedmineNow {
    constructor() {
    }

    initEventListener() {
      document.getElementById('fetch-button').addEventListener('click', () => {
        this.fetch();
      });

      return this;
    }

    fetch() {
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
        'sort=updated_on:desc'
      ];

      return `?${params.join('&')}`;
    }

    show(issues) {
      const issueCount = issues.length;

      if (issueCount === 0) return this;

      const container = document.getElementById('container');
      issues.forEach((issue) => {
        const box = document.createElement('div');
        const url = document.getElementById('url').value;

        box.id = `issue-${issue.id}`;
        box.className = 'issue';
        box.innerText = `${issue.status.name} - #${issue.id} ${issue.subject}`;
        box.addEventListener('click', () => {
          shell.openExternal(`${url}/issues/${issue.id}`);
        });

        container.insertBefore(box, container.firstChild);
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
    redmineNow.initEventListener()
      .updateLastExecutionTime();
  });
})();

