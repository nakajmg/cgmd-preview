import {EventEmitter2 as EventEmitter} from 'eventemitter2';
import {ipcMain} from 'electron';

class IPCManager extends EventEmitter {
  constructor() {
    super();
    this._eventify();
  }

  _eventify() {
    ipcMain.on('openPrevMarkdown', this._onOpenPrevMarkdown.bind(this));
    ipcMain.on('openDictionary', this._onOpenDictionary.bind(this));
  }

  _onOpenPrevMarkdown(e, filePath) {
    this.emit('openPrevMarkdown', filePath);
  }

  _onOpenDictionary(e, rulePath) {
    this.emit('openDictionary', rulePath);
  }
}

export const ipcManager = new IPCManager();
