'use strict';
import electron from 'electron';
import path from 'path';

export default class WindowManager {
  constructor() {
    const browserWindow = new electron.BrowserWindow({
      width: 1024,
      height: 768
    });
    const filePath = path.join(__dirname, '../window.html');
    browserWindow.loadURL(`file://${filePath}`);
    
    this.browserWindow = browserWindow;
  }
}
