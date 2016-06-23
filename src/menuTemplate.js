import {dialog} from 'electron';
import {ipcManager} from './ipcManager';

export const menuTemplate = [
  {
    label: 'Edit',
    submenu: [
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
      {label: 'Quit', accelerator: 'Command+Q', click: () => ipcManager.emit('quit')},
      {label: 'Close', accelerator: 'Command+W', click: ()=> ipcManager.emit('quit')}
    ]
  },
  {
    label: 'File',
    submenu: [
      {
        label: 'Open File',
        accelerator: 'Command+O',
        click: () => {
          dialog.showOpenDialog(
            {
              properties: ['openFile'],
              filters: [
                {name: 'markdown', extensions: ['md']}
              ]
            }, (filePaths) => {
              if (filePaths) {
                ipcManager.emit('openMarkdown', filePaths[0]);
              }
            });
        }
      },
      {
        label: 'Set Dictionary',
        accelerator: 'Command+Shift+O',
        click: () => {
          dialog.showOpenDialog(
            {
              properties: ['openFile'],
              filters:[
                {name: 'yaml', extensions: ['yml']}
              ]
            }, (filePaths) => {
              if (filePaths) {
                ipcManager.emit('openDictionary', filePaths[0]);
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
          ipcManager.emit('toggleLinter');
//          toggleTextlint();
        }
      }
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'Show Help',
        accelerator: 'Command+H',
        click: () => {
          ipcManager.emit('toggleHelp');
//          toggleHelp();
        }
      }
    ]
  }
];
