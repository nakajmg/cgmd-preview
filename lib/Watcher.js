import chokidar from 'chokidar';
import {ipcManager} from './ipcManager';

export default class Watcher {
  constructor() {
    
  }

  watch(filePath) {
    if (this.watcher) {
      this.watcher.close();
    }
    this.watcher = chokidar.watch(filePath, {
      ignored:  /[\/\\]\./
    })
    .on('all', this._onChange.bind(this));
  }

  _onChange(e, filePath) {
    ipcManager.emit('updatePreview', filePath);
  }
}
