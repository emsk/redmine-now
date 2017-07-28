'use strict';

import test from 'ava';
import {Application} from 'spectron';

test.beforeEach(async t => {
  t.context.app = new Application({
    path: `${__dirname}/../dist/mac/Redmine Now.app/Contents/MacOS/Redmine Now`,
    startTimeout: 10000
  });

  await t.context.app.start();
});

test.afterEach.always(async t => {
  await t.context.app.stop();
});

test(async t => {
  const app = t.context.app;
  await app.client.waitUntilWindowLoaded();

  const client = app.client;
  t.is(await client.getWindowCount(), 1);
  t.regex(await client.getUrl(), /^file:\/\/.+\/index.html$/);
  t.is(await client.getTitle(), 'Redmine Now');

  const win = app.browserWindow;
  const {width, height} = await win.getBounds();
  t.true(width > 0);
  t.true(height > 0);

  t.deepEqual(await win.getMinimumSize(), [300, 200]);
  t.true(await win.isVisible());
  t.true(await win.isResizable());
  t.true(await win.isFocused());
  t.false(await win.isMaximized());
  t.false(await win.isMinimized());
  t.false(await win.isFullScreen());
  t.true(await win.isMovable());
  t.true(await win.isMaximizable());
  t.true(await win.isMinimizable());
  t.true(await win.isFullScreenable());
  t.true(await win.isClosable());
  t.false(await win.isAlwaysOnTop());
  t.false(await win.isKiosk());
  t.false(await win.isDocumentEdited());
  t.false(await win.isMenuBarAutoHide());
  t.true(await win.isMenuBarVisible());
  t.false(await win.isVisibleOnAllWorkspaces());
  t.false(await win.isDevToolsOpened());
  t.false(await win.isDevToolsFocused());
});

