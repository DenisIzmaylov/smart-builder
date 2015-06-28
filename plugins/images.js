/**
 * @date 2014-10-03
 */
'use strict';
var path = require('path');
var gutil = require('gulp-util');
var plumber = require('gulp-plumber');
var changed = require('gulp-changed');
//var imagemin = require('gulp-imagemin');
//var spritesmith = require('gulp.spritesmith');
var del = require('del');

var _factory = function (config) {
  var gulp = config.gulp;
  var engines = config['engines'] || ['ico', 'gif', 'jpg', 'jpeg', 'png', 'svg'];
  var sourceMask = path.join(config.directories['source'], '**/*.{' + engines.join(',') + '}');
  var destDir = config.directories['public'];
  var destMask = path.join(destDir, '**/*.{' + engines.join(',') + '}');
  return {
    /** Implement task 'build' */
    build: function () {
      return gulp.src(sourceMask)
        .pipe(plumber())
        .pipe(config['changed'] ?
          changed(destDir) :
          gutil.noop())
        //.pipe(config['imagemin'] ?
        //    imagemin({
        //        svgoPlugins: [{cleanupIDs: false}]
        //    }) :
        //    gutil.noop())
        .pipe(gulp.dest(destDir));
    },
    /** Implement task 'clean' */
    clean: function (cb) {
      gutil.log('Delete: ' + destMask);
      del([destMask], {force: true}, cb);
    },
    /** Implement task 'watch' */
    watch: function () {
      gulp.watch(sourceMask, ['build:images']);
    }
  };
};

module.exports = _factory;
