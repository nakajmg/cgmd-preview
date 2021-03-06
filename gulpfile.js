const gulp = require('gulp');
const watchify = require('gulp-watchify');
const sequence = require('run-sequence');

const main = './src/index.js';
const browser = './src/window.js';

gulp.task('browserify', watchify((_watchify) => {
  var stream = gulp.src(main)
    .pipe(_watchify({
      ignoreMissing: true,
      detectGlobals: false,
      watch: false,
      transform: [
        ['babelify', {
          presets: [
            'es2015',
            'stage-3'
          ],
          plugins: [
            'transform-async-to-generator',
            'syntax-async-functions',
            'transform-regenerator'
          ]
        }]
      ],
      builtins: [],
    }))
    .pipe(gulp.dest('dist'));

  return stream;
}));

gulp.task('browser', watchify((_watchify) => {
  var stream = gulp.src(browser)
    .pipe(_watchify({
      ignoreMissing: true,
      detectGlobals: false,
      watch: false,
      transform: [
        ['babelify', {
          presets: [
            'es2015',
            'stage-3'
          ]
        }]
      ]
    }))
    .pipe(gulp.dest('dist'));

  return stream;
}));

gulp.task('copy', (cb) => {
  return gulp.src(['./src/style.min.css', './src/window.html', './package.json'])
    .pipe(gulp.dest('./dist'));
});

gulp.task('build', () => {
  return sequence(['browserify', 'browser'], 'copy');
});

