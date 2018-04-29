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

module.exports.formatDate = (date, todayTime) => {
  let options = {hour: '2-digit', minute: '2-digit', hour12: false};
  const dateTime = new Date(date.toLocaleDateString(navigator.language)).getTime();

  if (todayTime !== dateTime) {
    options = Object.assign({year: 'numeric', month: '2-digit', day: '2-digit'}, options);
  }

  return date.toLocaleString(navigator.language, options);
};

module.exports.formatDatetimeLocalValue = date => {
  const year = date.getFullYear();
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const day = `0${date.getDate()}`.slice(-2);
  const hour = `0${date.getHours()}`.slice(-2);
  const minute = `0${date.getMinutes()}`.slice(-2);

  return `${year}-${month}-${day}T${hour}:${minute}`;
};

