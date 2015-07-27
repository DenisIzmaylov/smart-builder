/**
 * @date 2014-10-15
 */
'use strict';
var path = require('path');
var gutil = require('gulp-util');
var plumber = require('gulp-plumber');
var changed = require('gulp-changed');
var htmlmin = require('gulp-htmlmin');
var size = require('gulp-filesize');
var del = require('del');

var _factory = function (config) {
  var gulp = config.gulp;
  var engines = config['engines'] || ['htm', 'html', 'hbs', 'handlebars'];
  var sourceMask = path.join(config.directories['source'], '**/*.{' + engines.join(',') + '}');
  var destDir = config.directories['destination'];
  var destMask = path.join(destDir, '**/*.{' + engines.join(',') + '}');
  return {
    /** Gulp task */
    build: function () {
      return gulp.src(sourceMask)
        .pipe(plumber())
        .pipe(config['changed'] ?
          changed(destDir) :
          gutil.noop())
        .pipe(config['htmlmin'] ?
          htmlmin({
            collapseWhitespace: true,
            removeComments: true,
            maxLineLength: 100,
            minifyCSS: true,
            minifyJS: true
          }) :
          gutil.noop())
        .pipe(gulp.dest(destDir))
        .pipe(size());
    },
    /** Gulp task */
    clean: function (cb) {
      gutil.log('Delete: ' + destMask);
      del([destMask], {force: true}, cb);
    },
    /** Gulp task */
    watch: function () {
      gulp.watch(sourceMask, ['build:templates']);
    }
  };
};

module.exports = _factory;
