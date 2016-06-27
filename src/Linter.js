import {TextLintEngine} from 'textlint';
import prh from 'textlint-rule-prh';
import ipcManager from './ipcManager';
import Event from './Event';

export default class Linter {
  constructor() {
    this._eventify();
    this.enable = true;
    this.currentFilePath = null;
  }

  _eventify() {
    ipcManager.on(Event.executeLint, this._onExecuteLint.bind(this));
    ipcManager.on(Event.openDictionary, this._onOpenDictionary.bind(this));
    ipcManager.on(Event.updatePreview, this._onUpdatePreview.bind(this));
    ipcManager.on(Event.toggleLinter, this._onToggleLinter.bind(this));
  }

  _initTextlintEngine(rulePath) {
    this.textlint = new TextLintEngine({});
    var ruleConfig = {prh: {rulePaths: [`${rulePath}`]}};
    this.textlint.config.rules = ['prh'];
    this.textlint.config.rulesConfig = ruleConfig;
    this.textlint.textlint.ruleCreatorSet.rawRulesObject = {prh};
    this.textlint.textlint.ruleCreatorSet.rawRulesConfigObject = ruleConfig;
    this.textlint.textlint.ruleCreatorSet.rules = {prh};
    this.textlint.textlint.ruleCreatorSet.ruleNames = ['prh'];
    this.textlint.textlint.ruleCreatorSet.rulesConfig = ruleConfig;
    this.textlint.ruleMap._store.prh = prh;
  }

  _onExecuteLint(filePath) {
    this.lint(filePath);
  }

  _onOpenDictionary(rulePath) {
    this._initTextlintEngine(rulePath);
    ipcManager.emit(Event.setRulePath, rulePath);
    if (this.currentFilePath) {
      this.lint(this.currentFilePath);
    }
  }

  _onSetRulePath(rulePath) {
    this.setRulePath(rulePath);
  }

  _onUpdatePreview(filePath) {
    this.lint(filePath);
  }

  _onToggleLinter() {
    this.enable = !this.enable;
    if (this.enable && this.currentFilePath) {
      this.lint(this.currentFilePath);
    }
    else {
      this.send('');
    }
  }

  setRulePath(rulePath) {
    this._initTextlintEngine(rulePath);
    if (this.currentFilePath) {
      this.lint(this.currentFilePath);
    }
  }

  lint(filePath) {
    if (!this.enable) {
      this.send('');
    }
    if (!this.textlint) return;
    if (!filePath) return;
    this.currentFilePath = filePath;

    this.textlint.executeOnFiles([filePath])
      .then((results) => {
        this._sendLintReport(results);
      });
  }
  
  _sendLintReport(results) {
    var report;
    function _reports(results) {
      let result = results.map(result => {
        let html = result.messages.map(m => {
          return _report(m);
        });
        return html.join('\n')
      }).join('\n');
      return result;
    }
  
    function _report({line, message}) {
      var [left, right] = message.split(' => ');
      return `<p>line: ${line} <span style="color: red;">${left}</span> => <span style="color: green;">${right}</span></p>`;
    }
    
    if (this.textlint.isErrorResults(results)) {
      report = _reports(results);
    }
    this.send(report);
  }

  send(report) {
    ipcManager.emit(Event.sendLintReport, report);
  }
  
}
