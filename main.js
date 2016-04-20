const app = require("app");
const BrowserWindow = require("browser-window");
const Menu = require('menu');
const fs = require('fs-extra');
const chokidar = require('chokidar');
const ipcMain = require('electron').ipcMain;
const path = require('path');
const TextLintEngine = require('textlint').TextLintEngine;
const temp = require('temp');

var __tempDirPath;
var __textlintConfigPath;
var enableTextlint;
var textlint;
var currentFilePath;

var mainWindow = null;
var watcher = null;

app.on("window-all-closed", () => {
  if (process.platform != "darwin") {
    app.quit();
  }
});

app.on("ready", () => {
  Menu.setApplicationMenu(menu);
  createTempDir()
    .then(() => {
      mainWindow = new BrowserWindow({width: 1024, height: 768});
      mainWindow.loadURL("file://" + __dirname + "/index.html");

      ipcMain.on('display-prev', (e, filePath) => {
        watch(filePath);
      });

      ipcMain.on('apply-prev-rule', (e, rulePath) => {
        createTextlintJSON(rulePath)
          .then(initTextlintEngine)
          .then(execLint);
      });

      mainWindow.on("closed", () => {
        mainWindow = null;
      });
    });
});

require("crash-reporter").start({
  companyName: 'cgmd-preview',
  submitURL: 'https://github.com/nakajmg/cgmd-preview/issues'
});

function createTempDir() {
  temp.track();
  return new Promise(function (resolve, reject) {
    temp.mkdir('hoge', function(err, dirPath) {
      if (err) reject();
      __tempDirPath = dirPath;
      resolve();
    });
  });
}

function createTextlintJSON(rulePath) {
  mainWindow.webContents.send('set-rule-path', rulePath);
  return new Promise(function(resolve, reject) {
    var filePath = path.join(__tempDirPath, 'textlintrc.json');
    fs.writeFile(filePath, `{
          "rules": {
            "prh": {
              "rulePaths": [${rulePath}]
            }
          }
        }`,
      function(err) {
        if(err) reject();
        __textlintConfigPath = filePath;
        resolve();
      });
  });
}

function initTextlintEngine() {
  return new Promise(function(resolve, reject) {
    textlint = new TextLintEngine({
      configFile: __textlintConfigPath
    });
    enableTextlint = true;
    resolve();
  });
}

function execLint() {
  function _noError() {
    mainWindow.webContents.send('report-textlint', '');
  }

  function _error(results) {
    let result = _reports(results);
    mainWindow.webContents.send('report-textlint', result);
  }

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

  var filePath = currentFilePath;
  if (!filePath) return;
  if (!enableTextlint) return;
  if (!textlint) return;

  textlint.executeOnFiles([filePath]).then(results => {
    if (textlint.isErrorResults(results)) {
      _error(results);
    }
    else {
      _noError();
    }
  });
}

function toggleTextlint() {
  if (enableTextlint) {
    // reset textlint results
    mainWindow.webContents.send('report-textlint', '');
    enableTextlint = false;
  }
  else {
    enableTextlint = true;
    execLint();
  }
}

function updatePreview(filePath) {
  fs.readFile(filePath, 'utf8', (err, file) => {
    mainWindow.webContents.send('open-markdown', {
      md: file,
      path: filePath,
      count: file.length
    });
  });
}

function watch(filePath) {
  if (watcher) {
    watcher.close();
  }
  currentFilePath = filePath;
  watcher = chokidar.watch(filePath, {ignored: /[\/\\]\./}).on('all', (event, filePath) => {
    updatePreview(filePath);
    execLint();
  });
}

const menuTemplate = [
  {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        role: 'undo'
      },
      {
        label: 'Redo',
        accelerator: 'Shift+CmdOrCtrl+Z',
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        role: 'cut'
      },
      {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        role: 'copy'
      },
      {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        role: 'paste'
      },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        role: 'selectall'
      }
    ]
  },
  {
    label: 'ReadUs',
    submenu: [
      {label: 'Quit', accelerator: 'Command+Q', click: () => app.quit()},
      {label: 'Close', accelerator: 'Command+W', click: ()=> app.quit()}
    ]
  },
  {
    label: 'File',
    submenu: [
      {
        label: 'Open',
        accelerator: 'Command+O',
        click: () => {
          require('dialog').showOpenDialog(
            {
              properties: ['openFile'],
              filters: [
                {name: 'markdown', extensions: ['md']}
              ]
            }, (filePaths) => {
              if (filePaths) {
                watch(filePaths[0]);
              }
          });
        }
      },
      {
        label: 'Set Dictionary',
        accelerator: 'Command+Shift+O',
        click: () => {
          require('dialog').showOpenDialog(
            {
              properties: ['openFile'],
              filters:[
                {name: 'yaml', extensions: ['yml']}
              ]
            }, (filePaths) => {
              if (filePaths) {
                createTextlintJSON(filePaths[0])
                  .then(initTextlintEngine)
                  .then(execLint);
              }
          });
        }
      }
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Toggle Developer Tools',
        accelerator: (function() {
          if (process.platform == 'darwin')
            return 'Alt+Command+I';
          else
            return 'Ctrl+Shift+I';
        })(),
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.webContents.toggleDevTools();
        }
      }
    ]
  },
  {
    label: 'Options',
    submenu: [
      {
        label: 'Toggle Textlint',
        accelerator: 'Command+Shift+T',
        click: () => {
          toggleTextlint();
        }
      }
    ]
  }
];

const menu = Menu.buildFromTemplate(menuTemplate);
