'use strict';

const isMac = process.platform === 'darwin';

module.exports.hideTitleBar = () => {
  if (isMac) {
    return false;
  }

  const titleBarElement = document.getElementById('title-bar');
  if (titleBarElement !== null) {
    titleBarElement.classList.add('windows');
  }

  const openSettingsButtonElement = document.getElementById('open-settings-button');
  if (openSettingsButtonElement !== null) {
    openSettingsButtonElement.classList.add('windows');
  }

  const mainElement = document.getElementById('main');
  if (mainElement !== null) {
    mainElement.classList.add('windows');
  }

  return true;
};

module.exports.formatDate = (date, todayTime = null) => {
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
};

