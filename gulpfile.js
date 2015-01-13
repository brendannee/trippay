var gulp = require('gulp');

var plugins = require("gulp-load-plugins")({
  pattern: ['gulp-*', 'gulp.*'],
  replaceString: /\bgulp[\-.]/
});

gulp.task('lint', function () {
  gulp.src('./**/*.js')
  .pipe(plugins.jshint());
});

gulp.task('develop', function () {
  plugins.nodemon({ script: 'bin/www', ext: 'jade js', ignore: ['public/javascripts/**'] })
  .on('change', ['lint'])
  .on('restart', function () {
    console.log('restarted!');
  });
});
