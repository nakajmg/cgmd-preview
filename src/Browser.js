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
    this._initializeArticle();
    this._initializeREADME();
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
  }

  _onMessage(e) {
    if (e.origin !== 'file://') return;

    switch(e.data.type) {
      case 'href':
        ipc.send(Event.openLink, e.data.href);
        break;
      case 'height':
        this._updateHeight(e.data.height);
        break;
    }
  }

  _onOpenMarkdown(e, file) {
    this._setCurrentFilePath(file.path);
    this._updateCount(file.count);
    let article = this._renderHTML(file);
    this._updatePreview(article);
  }

  _renderHTML(file) {
    let dirname = path.dirname(file.path);
    file.md = file.md.replace(/\(\.\//g, '(' + dirname + '/');
    let article = cgmd.render(file.md);
    return article;
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
    window.localStorage.setItem('CGMD-rule-path', rulePath);
  }

  _initializeArticle() {
    const html = `
      <html>
      <head>
        <link rel="stylesheet" href="http://ui.codegrid.net/assets2/css/codegrid-ui.min.css">
      </head>
      <body>
        <div class="CG2-narrowLayout">
          <div class="CG2-narrowLayout__main">
            <article class="CG2-article" id="article">
            </article>
          </div>
        </div>
        <script src="http://ui.codegrid.net/assets2/js/codegrid-ui.min.js"><\/script>
        <script>
          document.addEventListener('click', (e) => {
            let target = e.target || e.srcElement;
            if (target.nodeName !== 'A') return;
            e.preventDefault();
            let href = target.getAttribute('href');
            window.parent.postMessage({type: 'href', href}, '*');
          });
          
          const postHeight = (function() {
            var interval = 300;
            var timer;
            
            return function() {
              clearTimeout(timer);
              timer = setTimeout(function() {
                let height = document.querySelector('.CG2-narrowLayout').clientHeight + 'px';
                window.parent.postMessage({type: 'height', height}, '*');    
              }, interval);
            }
          })();
          const $article = document.querySelector('#article');
          window.addEventListener('resize', postHeight);
          window.addEventListener('message', (e) => {
            if (e.data.type === 'update') {
              $article.innerHTML = e.data.article;
              Prism.highlightAll(false, postHeight);
            }
          });
        <\/script>
      </body>
      </html>
      `;

    this.$iframe.contentWindow.document.open();
    this.$iframe.contentWindow.document.close();
    this.$iframe.contentWindow.document.write(html);
  }

  _updatePreview(article) {
    this.$iframe.contentWindow.postMessage({type: 'update', article}, '*');
  }

  _updateCount(count) {
    this.$count.textContent = count;
  }

  _updateHeight(height) {
    this.$height.textContent = height;
  }

  _initializeREADME() {
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
