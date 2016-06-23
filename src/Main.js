import electron from 'electron';
import WindowManager from './WindowManager';
import MenuManager from './MenuManager';
import Watcher from './Watcher';
import Linter from './Linter';
import ipcManager from './ipcManager';
import wordCounter from './wordCounter';
import fs from 'fs';
import 'babel-polyfill';
import Event from './Event';

export default class Main {
  constructor() {
    this.app = electron.app;
    this.linter = new Linter();
    this.watcher = new Watcher();
    this._eventify();
  }

  _eventify() {
    this.app.on('ready', this._onReady.bind(this));
    this.app.on("window-all-closed", this._onQuit.bind(this));
    ipcManager.on(Event.quit, this._onQuit.bind(this));
    ipcManager.on(Event.openMarkdown, this._onOpenMarkdown.bind(this));
    ipcManager.on(Event.openPrevMarkdown, this._onOpenMarkdown.bind(this));
    ipcManager.on(Event.updatePreview, this._onUpdatePreview.bind(this));
    ipcManager.on(Event.toggleHelp, this._onToggleHelp.bind(this));
    ipcManager.on(Event.toggleLinter, this._onToggleLinter.bind(this));
  }

  _onReady() {
    this.browserWindow = new WindowManager();
    this.menu = new MenuManager();
  }
  
  _onQuit() {
    this.app.quit();
  }
  
  _onOpenMarkdown(filePath) {
    this.watcher.watch(filePath);
  }

  _onUpdatePreview(filePath) {
    this.sendMarkdown(filePath);
  }

  _onToggleHelp() {

  }

  _onToggleLinter() {

  }

  sendMarkdown(filePath) {
    let file = fs.readFileSync(filePath, 'utf8');
    ipcManager.emit(Event.sendMarkdown, {
      md: file,
      path: filePath,
      count: wordCounter(file)
    });
  }

}
