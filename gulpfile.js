const gulp = require('gulp');
const watchify = require('gulp-watchify');

const main = './index.js';

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
