'use strict';
import electron from 'electron';
import path from 'path';
import {ipcManager} from './ipcManager';

export default class WindowManager {
  constructor() {
    const browserWindow = new electron.BrowserWindow({
      width: 1024,
      height: 768
    });
    const filePath = path.join(__dirname, '../window.html');
    browserWindow.loadURL(`file://${filePath}`);
    
    this.browserWindow = browserWindow;
    this._eventify();
  }

  _eventify() {
    this.browserWindow.on('closed', this._onClosed.bind(this));
    ipcManager.on('sendMarkdown', this._onSendMarkdown.bind(this));
  }

  _onClosed() {
    this.browserWindow = null;
  }

  _onSendMarkdown(file) {
    this.browserWindow.webContents.send('openMarkdown', file);
  }
} 
