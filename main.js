const app = require("app");
const BrowserWindow = require("browser-window");
const Menu = require('menu');
const fs = require('fs-extra');
const chokidar = require('chokidar');
const ipcMain = require('electron').ipcMain;

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
      path: filePath
    });
  });
}

function watch(filePath) {
  if (watcher) {
    watcher.close();
  }
  watcher = chokidar.watch(filePath, {ignored: /[\/\\]\./}).on('all', (event, filePath) => {
    updatePreview(filePath);
  });
}



const menuTemplate = [
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
