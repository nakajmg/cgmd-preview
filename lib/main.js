'use strict';
import electron from 'electron';
import WindowManager from './WindowManager';
import MenuManager from './MenuManager';
import {ipcManager} from './ipcManager';
import wordCounter from './wordCounter';
import fs from 'fs';

export default class Main {
  constructor() {
    this.app = electron.app;
    this._eventify();
  }

  _eventify() {
    this.app.on('ready', this._onReady.bind(this));
    this.app.on("window-all-closed", this._onQuit.bind(this));

    ipcManager.on('quit', this._onQuit.bind(this));
    ipcManager.on('openMarkdown', this._onOpenMarkdown.bind(this));
    ipcManager.on('openPrevMarkdown', this._onOpenMarkdown.bind(this));
    ipcManager.on('openDictionary', this._onOpenDictionary.bind(this));
  }

  _onReady() {
    this.browserWindow = new WindowManager();
    this.menu = new MenuManager();
  }
  
  _onQuit() {
    this.app.quit();
  }
  
  _onOpenMarkdown(filePath) {
    fs.readFile(filePath, 'utf8', (err, file) => {
      ipcManager.emit('sendMarkdown', {
        md: file,
        path: filePath,
        count: wordCounter(file)
      });
    });
  }
  
  _onOpenDictionary(filePath) {
    console.log(filePath);
  }

}

