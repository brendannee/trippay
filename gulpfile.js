var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var watchify = require('watchify');
var browserify = require('browserify');

var bundler = watchify(browserify('./public/javascripts/index.js', watchify.args));
bundler.on('update', bundle);

//Load all gulp-prefixed plugins
var plugins = require("gulp-load-plugins")({
  pattern: ['gulp-*', 'gulp.*'],
  replaceString: /\bgulp[\-.]/
});


gulp.task('jshint', function() {
  return gulp.src('./public/javascripts/**/*.js')
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('default'));
});


gulp.task('scss:lint', function() {
  gulp.src('./public/scss/**/*.scss')
    .pipe(plugins.scssLint({config: 'lint.yml'}));
});


gulp.task('scss:compileDev', function() {
  gulp.src('./public/scss/**/*.scss')
    //build sourcemaps
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.sass({errLogToConsole: true}))
    .pipe(plugins.sourcemaps.write())
    .pipe(gulp.dest('./public/css'));
});


gulp.task('scss:compile', function() {
  gulp.src('./public/scss/**/*.scss')
    .pipe(plugins.sass({errLogToConsole: true}))
    .pipe(gulp.dest('./public/css'));
});


gulp.task('css:minify', ['scss:compile'], function() {
  gulp.src('./public/css/*.css')
    .pipe(plugins.minifyCss())
    .pipe(gulp.dest('./public/css'));
});


gulp.task('js:develop', ['jshint'], function() {
  bundle()
    .pipe(plugins.express.notify());
});


gulp.task('js:compress', ['js:bundle'], function() {
  gulp.src('./public/dest/bundle.js')
    .pipe(plugins.uglify())
    .pipe(gulp.dest('./public/dest'));
});


gulp.task('js:bundle', bundle);


gulp.task('scss:develop', ['scss:lint', 'scss:compileDev']);


gulp.task('bower', function() {
  return plugins.bower();
});


gulp.task('develop', function() {
  plugins.express.run(['bin/www']);

  //watch for template changes
  gulp.watch(['views/**/*.jade'], plugins.express.notify);

  //watch for sass changes
  gulp.watch(['public/scss/**/*.scss'], ['scss:develop']);

  //watch for css changes
  gulp.watch(['public/css/**/*.css'], plugins.express.notify);

  //watch for front-end js changes
  gulp.watch(['public/javascripts/**/*.js'], ['js:develop']);

  //watch for image changes
  gulp.watch(['public/images/**/*'], plugins.express.notify);

  //watch for back-end js changes
  gulp.watch(['app.js', 'routes/**/*.js', 'libs/**/*.js'], function() {
    plugins.express.run(['bin/www']);
  });
});


gulp.task('build', [
  'bower',
  'css:minify',
  'js:compress'
], function() {
  process.exit();
});


function bundle() {
  return bundler.bundle()
    // log errors
    .on('error', plugins.util.log.bind(plugins.util, 'Browserify Error'))
    .pipe(source('bundle.js'))
    // build sourcemaps
    .pipe(buffer())
    .pipe(plugins.sourcemaps.init({loadMaps: true}))
    .pipe(plugins.sourcemaps.write('./'))
    .pipe(gulp.dest('./public/dest'));
}
