import open from 'open';
import {ipcRenderer as ipc} from 'electron';
import path from 'path';
import axios from 'axios';
import marked from 'marked';
import highlight from 'highlight.js';
import Event from './Event';
import CodeGridMarkdown from 'codegrid-markdown';
const cgmd = new CodeGridMarkdown();

export default class Browser {
  constructor() {
    this.$iframe = document.querySelector('#preview');
    this.$readme = document.querySelector('#readme');
    this.$log = document.querySelector('#log');
    this.$count = document.querySelector('#count');
    this.$height = document.querySelector('#height');
    this._eventify();
    this._beforeRender();
  }

  _eventify() {
    ipc.on(Event.openMarkdown, this._onOpenMarkdown.bind(this));
    ipc.on(Event.sendLintReport, this._onSendLintReport.bind(this));
    ipc.on(Event.setRulePath, this._onSetCurrentRulePath.bind(this));
    ipc.on(Event.toggleHelp, this._onToggleHelp.bind(this));
    window.addEventListener('message', this._onMessage.bind(this));
  }

  _beforeRender() {
    let prevPath = window.localStorage.getItem('CGMD-Preview');
    if (prevPath) {
      ipc.send(Event.openPrevMarkdown, prevPath);
    }

    let prevRulePath = window.localStorage.getItem('CGMD-rule-path');
    if (prevRulePath) {
      ipc.send(Event.openDictionary, prevRulePath);
    }

    this._setReadme();
  }

  _onMessage(e) {
    if (e.origin !== 'file://') return;

    switch(e.data.type) {
      case 'href':
        open(e.data.href);
        break;
      case 'height':
        this._updateHeight(e.data.height);
        break;
    }
  }

  _onOpenMarkdown(e, file) {
    const dirname = path.dirname(file.path);
    this._setCurrentFilePath(file.path);
    // パスの置き換え
    file.md = file.md.replace(/\(\.\//g, '(' + dirname + '/');
    const article = cgmd.render(file.md);
    this._updatePreview(article);
    this._updateCount(file.count);
  }

  _onSendLintReport(e, results) {
    this.$log.innerHTML = results ? results : '';
  }

  _onSetCurrentRulePath(e, rulePath) {
    this._setCurrentRulePath(rulePath);
  }

  _onToggleHelp(e) {
    if (this.$readme.getAttribute('open') === null) {
      this.$readme.showModal();
    }
    else {
      this.$readme.close();
    }
  }

  _setCurrentFilePath(filePath) {
    window.localStorage.setItem('CGMD-Preview', filePath);
  }

  _setCurrentRulePath(rulePath) {
    window.localStorage.setItem('CGMD-rule-path', filePath);
  }

  _createHTML(article) {
    const html = `
      <html>
      <head>
        <link rel="stylesheet" href="http://ui.codegrid.net/assets2/css/codegrid-ui.min.css">
      </head>
      <body>
        <div class="CG2-narrowLayout">
          <div class="CG2-narrowLayout__main">
            <article class="CG2-article">
              ${article}
            </article>
          </div>
        </div>
        <script src="http://ui.codegrid.net/assets2/js/codegrid-ui.min.js"><\/script>
        <script>
          [].forEach.call(document.querySelectorAll('a[href]'), (el) => {
            el.addEventListener('click', (e) => {
              e.preventDefault();
              var href = e.target.getAttribute('href');
              window.parent.postMessage({type: 'href', href}, '*');
            });
          });
          window.addEventListener('load', () => {
            var height = document.querySelector('.CG2-narrowLayout').clientHeight;
            window.parent.postMessage({type: 'height', height}, '*');
          });
          
          var postHeight = (function() {
            var interval = 300;
            var timer;
            
            return function() {
              clearTimeout(timer);
              timer = setTimeout(function() {
                var height = document.querySelector('.CG2-narrowLayout').clientHeight + 'px';
                window.parent.postMessage({type: 'height', height}, '*');    
              }, interval);
            }
          })();
          
          window.addEventListener('resize', postHeight);
          
        <\/script>
      </body>
      </html>
      `;
    return html;
  }

  _updatePreview(article) {
    const html = this._createHTML(article);
    this.$iframe.contentWindow.document.open();
    this.$iframe.contentWindow.document.write(html);
    this.$iframe.contentWindow.document.close();
  }

  _updateCount(count) {
    this.$count.textContent = count;
  }

  _updateHeight(height) {
    this.$height.textContent = height;
  }

  _setReadme() {
    axios.get('https://raw.githubusercontent.com/pxgrid/codegrid-markdown/master/README.md')
      .then(response => {
        marked.setOptions({
          highlight: function(code) {
            return highlight.highlightAuto(code).value;
          }
        });
        let readme = marked(response.data);
        let html = `
      <div class="CG2-narrowLayout">
        <div class="CG2-narrowLayout__main">
          <article class="CG2-article">
            ${readme}
          </article>
        </div>
      </div>
      `;
        this.$readme.innerHTML = html;
      })
      .catch(response => {
        console.log(response);
      });
  }
}
