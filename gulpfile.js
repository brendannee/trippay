var gulp = require('gulp');
var transform = require('vinyl-transform');
var watchify = require('watchify');
var browserify = require('browserify');

//Load all gulp-prefixed plugins
var plugins = require("gulp-load-plugins")({
  pattern: ['gulp-*', 'gulp.*'],
  replaceString: /\bgulp[\-.]/
});


var bundler = watchify(browserify('./public/javascripts/index.js', watchify.args));
bundler.on('update', bundle);
bundler.on('log', plugins.util.log);


gulp.task('jshint', function() {
  return gulp.src('./public/javascripts/**/*.js')
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('default'));
});


gulp.task('scss:lint', function() {
  gulp.src('./public/scss/**/*.scss')
    .pipe(plugins.scssLint());
});


gulp.task('scss:compileDev', function() {
  gulp.src('./public/scss/**/*.scss')
    //build sourcemaps
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.sass({errLogToConsole: true}))
    .pipe(plugins.sourcemaps.write())
    .pipe(gulp.dest('./public/css'));
});


gulp.task('scss:compile', ['fonts:copy'], function() {
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


gulp.task('js:compress', ['js:browserify'], function() {
  gulp.src('./public/dest/index.js')
    .pipe(plugins.uglify())
    .pipe(gulp.dest('./public/dest'));
});


gulp.task('js:browserify', function() {
  var browserified = transform(function(filename) {
    var b = browserify(filename)
    return b.bundle();
  });

  return gulp.src(['./public/javascripts/index.js'])
    .pipe(browserified)
    .pipe(gulp.dest('./public/dest'));
});


gulp.task('scss:develop', ['scss:lint', 'scss:compileDev']);


gulp.task('fonts:copy', function() {
  gulp.src(['./node_modules/bootstrap-sass/assets/fonts/bootstrap/*'])
    .pipe(gulp.dest('./public/dest/fonts'));
});


gulp.task('css:copy', function() {
  gulp.src(['./node_modules/mapbox.js/theme/**/*', './node_modules/bootstrap-slider/dist/css/bootstrap-slider.min.css'])
    .pipe(gulp.dest('./public/css/vendor'));
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
  'fonts:copy',
  'css:copy',
  'css:minify',
  'js:compress'
]);


function bundle() {
  return bundler.bundle()
    // log errors
    .on('error', plugins.util.log.bind(plugins.util, 'Browserify Error'))
    .pipe(require('vinyl-source-stream')('index.js'))
    // build sourcemaps
    .pipe(require('vinyl-buffer')())
    .pipe(plugins.sourcemaps.init({loadMaps: true})) // loads map from browserify file
    .pipe(plugins.sourcemaps.write('./')) // writes .map file
    .pipe(gulp.dest('./public/dest'));
}
