var app = require("app");
var BrowserWindow = require("browser-window");
var Menu = require('menu');
var fs = require('fs-extra');
var chokidar = require('chokidar');

require("crash-reporter").start();

var mainWindow = null;

app.on("window-all-closed", () => {
  if (process.platform != "darwin") {
    app.quit();
  }
});

app.on("ready", () => {
  Menu.setApplicationMenu(menu);
  mainWindow = new BrowserWindow({width: 1024, height: 768});
  mainWindow.loadUrl("file://" + __dirname + "/index.html");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
});

function updatePreview(filePath) {
  fs.readFile(filePath, 'utf8', function(err, file) {
    mainWindow.webContents.send('open-markdown', {
      md: file,
      path: filePath
    });
  });
}
var watcher = null;
var menuTemplate = [
  {
    label: 'ReadUs',
    submenu: [
      {label: 'Quit', accelerator: 'Command+Q', click: function () {app.quit();}}
    ]
  },
  {
    label: 'File',
    submenu: [
      {label: 'Open', accelerator: 'Command+O', click: function() {
        // 「ファイルを開く」ダイアログの呼び出し
        require('dialog').showOpenDialog({ properties: ['openFile']}, function (filePaths){
          if (watcher) {
            watcher.close();
          }
          watcher = chokidar.watch(filePaths[0], {ignored: /[\/\\]\./}).on('all', (event, filePath) => {
            updatePreview(filePath);
          });
        });
      }}
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.reload();
        }
      },
      {
        label: 'Toggle Full Screen',
        accelerator: (function() {
          if (process.platform == 'darwin')
            return 'Ctrl+Command+F';
          else
            return 'F11';
        })(),
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
        }
      },
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
      },
    ]
  }
];

var menu = Menu.buildFromTemplate(menuTemplate);
