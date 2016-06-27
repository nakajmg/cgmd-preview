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
    ipcManager.on(Event.setRulePath, this._onSetRulePath.bind(this));
    ipcManager.on(Event.executeLint, this._onExecuteLint.bind(this));
    ipcManager.on(Event.openDictionary, this._onSetRulePath.bind(this));
    ipcManager.on(Event.updatePreview, this._onUpdatePreview.bind(this));
    ipcManager.on(Event.toggleLinter, this._onToggleLinter.bind(this));
  }

  _initTextlintEngine(rulePath) {
    var _this = this;
    return new Promise(function(resolve, reject) {
      _this.textlint = new TextLintEngine({});
      var ruleConfig = {prh: {rulePaths: [`${rulePath}`]}};
      _this.textlint.config.rules = ['prh'];
      _this.textlint.config.rulesConfig = ruleConfig;
      _this.textlint.textlint.ruleCreatorSet.rawRulesObject = {prh};
      _this.textlint.textlint.ruleCreatorSet.rawRulesConfigObject = ruleConfig;
      _this.textlint.textlint.ruleCreatorSet.rules = {prh};
      _this.textlint.textlint.ruleCreatorSet.ruleNames = ['prh'];
      _this.textlint.textlint.ruleCreatorSet.rulesConfig = ruleConfig;
      _this.textlint.ruleMap._store.prh = prh;
      resolve();
    });
  }

  _onExecuteLint(filePath) {
    this.lint(filePath);
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
    this.rulePath = rulePath;
    this._initTextlintEngine(rulePath);
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
