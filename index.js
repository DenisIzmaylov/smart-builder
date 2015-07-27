/**
 * Gulp Smart Builder
 * Make your build process a smarter by build tools integration,
 * declarative configuration and using all best practicies of today
 * @author Denis Izmaylov
 * @license MIT
 * @date 2015-05-11
 *
 * CONTRIBUTION:
 * 1. Please use `path` term for URI and `dir` for directories.
 *
 * TODO:
 * 1. Add spritesmith for gulp
 * 2. Implement changelog generation (see https://github.com/rackt/react-router/tree/master/scripts)
 * 3. Add support for npm tasks?
 * 4. Get all the best from https://www.npmjs.com/package/isomorphic
 * 5. https://github.com/ember-cli/ember-cli-deploy
 */
var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var objectAssign = require('object-assign');
var objectAssignDeep = require('object-assign-deep');
var runSequence = require('run-sequence');
var del = require('del');
var packageConfig = require('./package.json');
/**
 * @param {Object} params
 * @param {String} [params.root] directory
 * @param {Object} [params.directories] you can specify all or some of them
 * @param {String} [params.directories.source]
 * @param {String} [params.directories.destination]
 * @param {String} [params.directories.public]
 * @param {Object} [params.gulp] instance
 * @param {Object} [params.config] for build
 * @private
 */
var _constructor = function (params) {
  gutil.log(gutil.colors.white(packageConfig['name'] + ' v' + packageConfig['version']));
  if (process.env.NODE_ENV && process.env.NODE_ENV === 'production') {
    gutil.log(gutil.colors.yellow('Started in PRODUCTION mode'));
  } else {
    gutil.log('Started in development mode');
  }
  if (typeof params === 'object') {
    this.NODE_ENV =  process.env['NODE_ENV'] || 'development';
    // save params in builder instance
    if (params.root) {
      this.root = params.root;
    }
    if (params.directories) {
      this.directories = objectAssign({}, this.directories, params.directories);
    }
    if (params.gulp) {
      this._gulp = params.gulp;
    }
    // apply config params
    if (params.config) {
      this.config(params.config);
    }
  }
};
/**
 * Load modules and create Gulp tasks
 * @param {Object} config
 */
_constructor.prototype.config = function (config) {
  gutil.log('Use config: ' + gutil.colors.grey(JSON.stringify(config)));
  // Connect modules and fetch supported tasks
  for (var name in config) {
    if (!config.hasOwnProperty(name)) continue;
    if (config[name] !== false) {
      // Require module which are in first-level keys at config
      gutil.log('Require plugin: [' + name + ']');
      var moduleFactory;
      if (fs.existsSync(path.join(__dirname, 'plugins', name + '.js'))) {
        moduleFactory = require('./plugins/' + name);
      } else {
        moduleFactory = require('gulp-smart-' + name);
      }
      var moduleConfig = config[name];
      if (typeof moduleFactory !== 'function') {
        gutil.log(gutil.colors.red('Error: module [' + name + '] does not export module factory.'));
        continue;
      }
      // Every module returns a factory which we use to create an instance
      var moduleInstance = moduleFactory(objectAssign({
        root: this.root,
        gulp: this._gulp,
        directories: this.directories
      }, moduleConfig));
      // Register methods of the instance as supported tasks
      for (var method in moduleInstance) {
        if (!moduleInstance.hasOwnProperty(method)) continue;
        if (typeof moduleInstance[method] === 'function') {
          if (!this._tasks) {
            this._tasks = [];
          }
          if (this._tasks.indexOf(method) < 0) {
            this._tasks.push(method);
          }
        }
      }
      gutil.log('  fetched tasks: [' + Object.keys(moduleInstance).join(', ') + ']');
      // Register module instance
      if (!this._gulpModules) {
        this._gulpModules = {};
      }
      this._gulpModules[name] = moduleInstance;
    }
  }
  // Save config updates
  this.config = objectAssignDeep(this.config, config);
};
/**
 * Create tasks according the config
 */
_constructor.prototype.run = function () {
  _createGulpTasks(this, this._gulp);
};
/**
 * Create gulp tasks
 */
var _createGulpTasks = function (instance, gulp) {
  // Create gulp sub-tasks
  var tasksMap = {};
  var ignoreTasks = [];
  for (var name in instance._gulpModules) {
    if (!instance._gulpModules.hasOwnProperty(name)) continue;
    var moduleInstance = instance._gulpModules[name];
    // lookup every method
    for (var method in moduleInstance) {
      if (!moduleInstance.hasOwnProperty(method)) continue;
      if (typeof moduleInstance[method] === 'function') {
        // Extract dependencies list for each task
        var deps = [];
        if (instance.config[name]['dependencies']) {
          var modules = instance._gulpModules;
          instance.config[name]['dependencies'].forEach(function (name) {
            if (modules[name] && typeof modules[name][method] === 'function') {
              deps.push(method + ':' + name);
              ignoreTasks.push(method + ':' + name);
            }
          });
        }
        // register task with their dependencies
        gutil.log('Register task: [' + gutil.colors.cyan(method + ':' + name) + ']');
        if (deps.length > 0) {
          gutil.log('  depends on ' + deps.join(', '));
          gulp.task(method + ':' + name, deps, moduleInstance[method].bind(moduleInstance));
        } else {
          gulp.task(method + ':' + name, moduleInstance[method].bind(moduleInstance));
        }
        // save subtasks for each base task
        if (!tasksMap[method]) {
          tasksMap[method] = [];
        }
        tasksMap[method].push(method + ':' + name);
      }
    }
  }
  // Create base tasks (clean, build, etc)
  for (var name in tasksMap) {
    if (!tasksMap.hasOwnProperty(name)) continue;
    var deps = [];
    var ignored = [];
    tasksMap[name].forEach(function (subtask) {
      if (ignoreTasks.indexOf(subtask) === -1) {
        deps.push(subtask);
      } else {
        ignored.push(subtask);
      }
    });
    gutil.log('Register task: [' + gutil.colors.cyan(name) + ']');
    gutil.log('  depends on ' + deps.join(', '));
    if (ignored.length > 0) {
      gutil.log('  skipped: ' + ignored.join(', '));
    }
    if (name === 'watch') {
      // In this case we have to finish `clean` and then `build` tasks before
      gulp.task('watch', function (cb) {
        runSequence.apply(0, this.concat(cb));
      }.bind(['clean', 'build'].concat(deps)));
    } else {
      gulp.task(name, deps, function () {
        // nothing yet
      });
    }
  }
  // create maintance tasks
  gulp.task('clean', function (cb) {
    del([
      this.directories['public'],
      this.directories['destination']
    ], {force: true}, cb);
  }.bind(instance));
  gulp.task('default', ['clean'], function (cb) {
    runSequence('build', cb);
  });
};
/** export */
module.exports = _constructor;
