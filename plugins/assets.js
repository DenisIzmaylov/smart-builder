var path = require('path');
var gutil = require('gulp-util');
var changed = require('gulp-changed');
var del = require('del');

var _factory = function (config) {
  var gulp = config.gulp;
  var sourceDir = config.directories['source'];
  var sourceMask = path.join(sourceDir, 'assets/**/*');
  var destDir = config.directories['public'];
  var destMask = path.join(destDir, '**/*');
  return {
    /** Implement task 'build' */
    build: function () {
      return gulp.src(sourceMask)
        .pipe(plumber())
        .pipe(config['changed'] ?
          changed(destDir) :
          gutil.noop())
        .pipe(gulp.dest(destDir));
    },
    /** Implement task 'clean' */
    clean: function (cb) {
      gutil.log('Delete: ' + destMask);
      del([destMask], {force: true}, cb);
    },
    /** Implement task 'watch' */
    watch: function () {
      gulp.watch(sourceMask, ['build:assets']);
    }
  };
};

module.exports = _factory;
