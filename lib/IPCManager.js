import {EventEmitter2 as EventEmitter} from 'eventemitter2';
import {ipcMain} from 'electron';

class IPCManager extends EventEmitter {
  constructor() {
    super();
    this._eventify()
  }

  _eventify() {
    ipcMain.on('openPrevMarkdown', this._onOpenPrevMarkdown.bind(this));
  }

  _onOpenPrevMarkdown(e, filePath) {
    this.emit('openPrevMarkdown', filePath);
  }
}

export const ipcManager = new IPCManager();
