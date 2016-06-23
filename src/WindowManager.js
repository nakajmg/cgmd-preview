import electron from 'electron';
import path from 'path';
import ipcManager from './ipcManager';
import Event from './Event';

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
    ipcManager.on(Event.sendMarkdown, this._onSendMarkdown.bind(this));
    ipcManager.on(Event.sendLintReport, this._onSendLintReport.bind(this));
  }

  _onClosed() {
    this.browserWindow = null;
  }

  _onSendMarkdown(file) {
    this.browserWindow.webContents.send(Event.openMarkdown, file);
  }
  
  _onSendLintReport(report) {
    this.browserWindow.send(Event.sendLintReport, report)
  }
} 
