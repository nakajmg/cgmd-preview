import {Menu} from 'electron';
import {menuTemplate} from './menuTemplate';

export default class MenuManager {
  constructor() {
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
  }
}
