import {TextLintEngine} from 'textlint';
import prh from 'textlint-rule-prh';
import {ipcManager} from './ipcManager';

export default class Linter {
  constructor() {
    this._eventify();
  }

  _eventify() {
    ipcManager.on('setRulePath', this._onSetRulePath.bind(this));
    ipcManager.on('executeLint', this._onExecuteLint.bind(this));
    ipcManager.on('openDictionary', this._onSetRulePath.bind(this));
    ipcManager.on('updatePreview', this._onUpdatePreview.bind(this));
  }

  _initTextlintEngine(rulePath) {
    var _this = this;
    return new Promise(function(resolve, reject) {
      _this.textlint = new TextLintEngine({});
      var ruleConfig = {prh: {"rulePaths": [`${rulePath}`]}};
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

  setRulePath(rulePath) {
    this.rulePath = rulePath;
    this._initTextlintEngine(rulePath);
  }

  lint(filePath) {
    if (!this.textlint) return;
    if (!filePath) return;

    this.textlint.executeOnFiles([filePath])
      .then((results) => {
        if (this.textlint.isErrorResults(results)) {
          results.forEach((result) => {
            result.messages.forEach((msg) => {
              console.log(msg);
            });
          });
        }
        else {
          console.log('no error on lint');
        }
      })
  }
}
