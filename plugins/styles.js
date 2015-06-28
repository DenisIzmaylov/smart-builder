/**
 * @date 2014-10-10
 * TODO:
 * 1. Add support for combineMediaQueries
 */
/* jshint node: true */
'use strict';
var path = require('path');
var gutil = require('gulp-util');
var plumber = require('gulp-plumber');
var changed = require('gulp-changed');
var sourceMaps = require('gulp-sourcemaps');
//var cssimport = require('gulp-cssimport');
//var rework = require('gulp-rework');
//var postCSS = require('gulp-postcss');
var prefix = require('gulp-autoprefixer');
//var stylus = require('gulp-stylus');
//var sass = require('gulp-sass');
var minifyCSS = require('gulp-minify-css');
var cssBase64 = require('gulp-css-base64');
var size = require('gulp-filesize');
var streamqueue = require('streamqueue');
//var revall = require('gulp-rev-all');
var del = require('del');

var _factory = function (config) {
  var gulp = config.gulp;
  var engines = config['engines'] || ['css', 'less'];
  var sourceDir = config.directories['source'];
  var sourceMask = path.join(sourceDir, '**/*.{' + engines.join(',') + '}');
  var destDir = config.directories['public'];
  var destMask = path.join(destDir, '**/*.css');
  var customCSSVars = config['vars'] || {};
  return {
    /** Gulp task */
    build: function () {
      var streams = [];
      if (engines.indexOf('css') >= 0) {
        streams.push(
          gulp.src(path.join(sourceDir, '**/*.css'))
            //.pipe(plumber())
            //.pipe(sourceMaps.init())
          //.pipe(cssimport()),
        );
      }
      if (engines.indexOf('less') >= 0) {
        var less = require('gulp-less');
        streams.push(
          gulp.src(path.join(sourceDir, '**/*.less'))
            .pipe(plumber())
            //.pipe(sourceMaps.init())
            //.pipe(less({}, {
            //  modifyVars: customCSSVars
            //}))
            .pipe(less())
        );
      }
      var taskStream;
      if (streams.length > 1) {
        taskStream = streamqueue.apply(streamqueue, [{objectMode: true}].concat(streams));
      } else if (streams.length === 1) {
        taskStream = streams[0];
      }
      if (taskStream) {
        // @todo add auto-prefixer
        return taskStream
          .pipe(config['changed'] ?
            changed(config.directories['destination']) :
            gutil.noop())
          .pipe(cssBase64())
          .pipe(config['minify'] ?
            minifyCSS() :
            gutil.noop())
          //.pipe((config['sourceMaps'] !== false) ?
          //  ((config['sourceMaps'] === 'external') ?
          //    sourceMaps.write('./') : sourceMaps.write()) :
          //  gutil.noop())
          .pipe(gulp.dest(destDir));
      } else {
        return false;
      }
    },
    /** Gulp task */
    clean: function (cb) {
      gutil.log('Delete: ' + destMask);
      del([destMask], {force: true}, cb);
    },
    /** Gulp task */
    watch: function () {
      gulp.watch(sourceMask, ['build:styles']);
    }
  };
};

module.exports = _factory;
