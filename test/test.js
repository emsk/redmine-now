'use strict';

describe('application launch', function() {
  const Application = require('spectron').Application;
  const chai = require('chai');
  const chaiAsPromised = require('chai-as-promised');
  const app = new Application({
    path: `${__dirname}/../dist/mac/Redmine Now.app/Contents/MacOS/Redmine Now`
  });

  chai.should();
  chai.use(chaiAsPromised);
  chaiAsPromised.transferPromiseness = app.transferPromiseness;

  beforeEach(() => {
    return app.start();
  });

  afterEach(() => {
    if (app && app.isRunning()) {
      return app.stop();
    }
  });

  it('opens a window', () => {
    return app.client.waitUntilWindowLoaded()
      .getWindowCount().should.eventually.equal(1)
      .browserWindow.getBounds().should.eventually.have.property('width').equal(850)
      .browserWindow.getBounds().should.eventually.have.property('height').equal(625)
      .browserWindow.isVisible().should.eventually.be.true
      .browserWindow.isResizable().should.eventually.be.true
      .browserWindow.isFocused().should.eventually.be.true
      .browserWindow.isMaximized().should.eventually.be.false
      .browserWindow.isMinimized().should.eventually.be.false
      .browserWindow.isFullScreen().should.eventually.be.false
      .browserWindow.isMovable().should.eventually.be.true
      .browserWindow.isMaximizable().should.eventually.be.true
      .browserWindow.isMinimizable().should.eventually.be.true
      .browserWindow.isFullScreenable().should.eventually.be.true
      .browserWindow.isClosable().should.eventually.be.true
      .browserWindow.isAlwaysOnTop().should.eventually.be.false
      .browserWindow.isKiosk().should.eventually.be.false
      .browserWindow.isDocumentEdited().should.eventually.be.false
      .browserWindow.isMenuBarAutoHide().should.eventually.be.false
      .browserWindow.isMenuBarVisible().should.eventually.be.true
      .browserWindow.isVisibleOnAllWorkspaces().should.eventually.be.false
      .browserWindow.isDevToolsOpened().should.eventually.be.false
      .browserWindow.isDevToolsFocused().should.eventually.be.false
      .getUrl().should.eventually.match(/^file:\/\/.+\/index.html$/)
      .getTitle().should.eventually.equal('Redmine Now');
  });
});

