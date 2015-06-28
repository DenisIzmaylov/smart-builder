/**
 * @date 2014-10-31
 */
/* jshint node: true */
'use strict';
var path = require('path');
var gutil = require('gulp-util');
var plumber = require('gulp-plumber');
var changed = require('gulp-changed');
var del = require('del');

var _factory = function (config) {
  var gulp = config.gulp;
  var sourceMask = path.join(config.directories['source'], '**/*.swf');
  var destPath = path.join(config.directories['destination'], config.directories['public']);
  var destMask = path.join(destPath, '**/*.swf');
  return {
    /** Gulp task */
    build: function () {
      return gulp.src(sourceMask)
        .pipe(plumber())
        .pipe(config.cache ?
          changed(destPath) :
          gutil.noop())
        .pipe(gulp.dest(destPath));
    },
    /** Gulp task */
    clean: function (cb) {
      gutil.log('Delete: ' + destMask);
      del([destMask], {force: true}, cb);
    },
    /** Gulp task */
    watch: function () {
      gulp.watch(sourceMask, ['build:swf']);
    }
  }
};

module.exports = _factory;
