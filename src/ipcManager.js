import {EventEmitter2 as EventEmitter} from 'eventemitter2';
import {ipcMain} from 'electron';
import Event from './Event';

class IPCManager extends EventEmitter {
  constructor() {
    super();
    this._eventify();
  }

  _eventify() {
    ipcMain.on(Event.openPrevMarkdown, this._onOpenPrevMarkdown.bind(this));
    ipcMain.on(Event.openDictionary, this._onOpenDictionary.bind(this));
  }

  _onOpenPrevMarkdown(e, filePath) {
    this.emit(Event.openPrevMarkdown, filePath);
  }

  _onOpenDictionary(e, rulePath) {
    this.emit(Event.openDictionary, rulePath);
  }
}

export default new IPCManager();
