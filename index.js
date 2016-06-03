const CGMD = require('codegrid-markdown');
const cgmd = new CGMD();
const ipc = require('electron').ipcRenderer;
const path = require('path');
const $iframe = document.querySelector('#preview');
const $readme = document.querySelector('#readme');
const $log = document.querySelector('#log');

ipc.on('open-markdown', (e, file) => {
  const dirname = path.dirname(file.path);
  setCurrentFilePath(file.path);
  file.md = file.md.replace(/\(\.\//g, '(' + dirname + '/');
  const article = cgmd.render(file.md);
  updatePreview(article);
  updateCount(file.count);
});

ipc.on('report-textlint', (e, results) => {
  $log.innerHTML = results;
});

ipc.on('set-rule-path', (e, filePath) => {
  setCurrentRulePath(filePath);
});

ipc.on('toggle-help', (e) => {
  if ($readme.getAttribute('open') === null) {
    $readme.showModal();
  }
  else {
    $readme.close();
  }
});

function updatePreview(article) {
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

  $iframe.contentWindow.document.open();
  $iframe.contentWindow.document.write(html);
  $iframe.contentWindow.document.close();
}

function setCurrentFilePath(filePath) {
  window.localStorage.setItem('CGMD-Preview', filePath);
}

function getPrevFilePath() {
  return window.localStorage.getItem('CGMD-Preview');
}

function setCurrentRulePath(filePath) {
  window.localStorage.setItem('CGMD-rule-path', filePath);
}

function getPrevRulePath() {
  return window.localStorage.getItem('CGMD-rule-path');
}

function updateCount(count) {
  document.querySelector('#count').textContent = count;
}

function updateHeight(height) {
  document.querySelector('#height').textContent = height;
}

function setReadme() {
  const axios = require('axios');
  const marked = require('marked');
  axios.get('https://raw.githubusercontent.com/pxgrid/codegrid-markdown/master/README.md')
    .then(response => {
      marked.setOptions({
        highlight: function(code) {
          return require('highlight.js').highlightAuto(code).value;
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
      $readme.innerHTML = html;
    })
    .catch(response => {
      console.log(response);
    });
}

const prevPath = getPrevFilePath();
if (prevPath) {
  ipc.send('display-prev', prevPath);
}

const prevRulePath = getPrevRulePath();
if (prevRulePath) {
  ipc.send('apply-prev-rule', prevRulePath);
}

setReadme();

window.addEventListener('message', (e) => {
  var open = require('open');
  if (e.origin !== 'file://') return;

  switch(e.data.type) {
    case 'href':
      open(e.data.href);
      break;
    case 'height':
      updateHeight(e.data.height);
      break;
  }
});
