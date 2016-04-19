const app = require("app");
const BrowserWindow = require("browser-window");
const Menu = require('menu');
const fs = require('fs-extra');
const chokidar = require('chokidar');
const ipcMain = require('electron').ipcMain;
const path = require('path');
const TextLintEngine = require('textlint').TextLintEngine;
const textlint = new TextLintEngine({
  configFile: path.resolve(__dirname, './textlintrc.json')
});

require("crash-reporter").start();

var mainWindow = null;
var watcher = null;

app.on("window-all-closed", () => {
  if (process.platform != "darwin") {
    app.quit();
  }
});

app.on("ready", () => {
  Menu.setApplicationMenu(menu);
  mainWindow = new BrowserWindow({width: 1024, height: 768});
  mainWindow.loadUrl("file://" + __dirname + "/index.html");

  ipcMain.on('display-prev', (e, filePath) => {
    watch(filePath);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
});

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
  watcher = chokidar.watch(filePath, {ignored: /[\/\\]\./}).on('all', (event, filePath) => {
    updatePreview(filePath);
    lint(filePath);
  });
}

function lint(filePath) {
  textlint.executeOnFiles([filePath]).then(results => {
    if (textlint.isErrorResults(results)) {
      let result = reporter(results);
      mainWindow.webContents.send('report-textlint', result);
    }
    else {
      mainWindow.webContents.send('report-textlint', '');
    }
  });
}

function reporter(results) {
  function report({line, message}) {
    var [left, right] = message.split(' => ');
    return `<p>line: ${line} <span style="color: red;">${left}</span> => <span style="color: green;">${right}</span></p>`;
  }
  let result = results.map(result => {
    let html = result.messages.map(m => {
      return report(m);
    });
    return html.join('\n')
  }).join('\n');
  return result;
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
      {label: 'Open', accelerator: 'Command+O', click: () => {
        require('dialog').showOpenDialog({ properties: ['openFile'], filters: [{name: 'markdown', extensions: ['md']}]}, (filePaths) => {
          if (filePaths) {
            watch(filePaths[0]);
          }
        });
      }}
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
  }
];

const menu = Menu.buildFromTemplate(menuTemplate);
