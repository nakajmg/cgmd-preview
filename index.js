const CGMD = require('codegrid-markdown');
const cgmd = new CGMD();
const ipc = require('electron').ipcRenderer;
const path = require('path');
const $iframe = document.querySelector('iframe');
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

const prevPath = getPrevFilePath();
if (prevPath) {
  ipc.send('display-prev', prevPath);
}

const prevRulePath = getPrevRulePath();
if (prevRulePath) {
  ipc.send('apply-prev-rule', prevRulePath);
}
