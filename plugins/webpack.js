/**
 * webpack mixin for SmartBuild
 * @date 2015-05-11
 * @license MIT
 *
 * TODO
 * 1. Some features from https://github.com/petehunt/webpack-howto
 * 2. Add process.env.PUBLIC_DIR and process.env.PUBLIC_URI
 */
'use strict';
var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var objectAssign = require('object-assign');

var _factory = function (config) {
  var sourceDir = path.join(config.root, config.directories['source']);
  var destDir = path.join(config.root, config.directories['destination']);
  var publicDir = path.join(config.root, config.directories['public']);
  var webpackConfig = require(path.join(config.root, config['configFile'] || 'webpack.config'));
  // Build <configByTargets> map where key is target ('node', 'web', etc) and value is config copy
  var configByTargets = {};
  if (typeof config['entry'] === 'string') {
    // One simple entry
    configByTargets['web'] = objectAssign({}, webpackConfig, {
      entry: config['entry']
    });
  } else if (typeof config['entry'] === 'object') {
    // For entries map extract items to <configByTargets>
    var entries = config['entry'];
    for (var key in entries) {
      if (!entries.hasOwnProperty(key)) continue;
      // detect <configTarget>
      var configTarget =
        (typeof entries[key] === 'object' && entries[key]['target'] !== 'web') ?
          entries[key]['target'] :
          'web';
      var entryFile = (typeof entries[key] === 'object') ?
        entries[key]['file'] :
        entries[key];
      // Create config copy for the target or just add entry
      if (!configByTargets[configTarget]) {
        var entry = {};
        entry[key] = [entryFile];
        configByTargets[configTarget] = objectAssign({}, webpackConfig, {
          entry: entry,
          target: configTarget
        });
      } else {
        configByTargets[configTarget].entry[key] = entryFile;
      }
    }
  }
  // Build custom configs for each in <configByTargets>
  for (var target in configByTargets) {
    if (!configByTargets.hasOwnProperty(target)) continue;
    var current = configByTargets[target];
    current.context = sourceDir;
    // Fork `output` section and update according to `target`
    current.output = objectAssign({}, current.output);
    if (target === 'web') {
      current.output.path = publicDir;
    } else {
      current.output.path = destDir;
      current.output.libraryTarget = 'commonjs2';
    }
    // Fork `loaders` collection
    current.module.loaders = [].concat(current.module.loaders);
    if (target === 'node') {
      current.module.loaders.forEach(function (item) {
        if (item.loader.indexOf('style-loader') >= 0) {
          item.loader = item.loader.replace('style-loader!', '');
        }
      });
    }
    if (config['extractCSSToFile']) {
      // To use this feature run in console:
      // npm install extract-text-webpack-plugin --save-dev
      // But be aware - it does not work with Hot Module Replacement and causes FUC
      var ExtractTextPlugin = require('extract-text-webpack-plugin');
      current.module.loaders.forEach(function (item) {
        if (item.loader.indexOf('style-loader') >= 0) {
          item.loader = ExtractTextPlugin.extract("style-loader", "css-loader");
        }
      });
    }
    // Fork `plugins` collection
    current.plugins = [].concat(current.plugins);
    // Apply global vars __BROWSER__ and __SERVER__ to determinate target
    current.plugins.push(
      new webpack.DefinePlugin({
        '__BROWSER__': JSON.stringify(target === 'web'),
        '__SERVER__': JSON.stringify(target !== 'web')
      })
    );
    if (target === 'web') {
      current.plugins.push(
        new webpack.IgnorePlugin(/^(fs|dtrace\-provider)$/)
      )
    }
    if (target === 'node') {
      // PATCH webpack config to use Node.js modules in right way
      // See https://github.com/jlongster/backend-with-webpack
      // to get more information
      var nodeModules = {};
      fs.readdirSync('node_modules')
        .filter(function(x) {
          return ['.bin'].indexOf(x) === -1;
        })
        .forEach(function(mod) {
          nodeModules[mod] = 'commonjs ' + mod;
        });
      current.externals = objectAssign({}, current.externals, nodeModules);
      current.plugins.push(
        new webpack.BannerPlugin('require("source-map-support").install();', {
            raw: true,
            entryOnly: false
          })
      );
      current.node = {
        console: false,
          global: false,
          process: false,
          Buffer: false,
          __filename: false,
          __dirname: false
      };
    }
    if (config['normalModuleReplacement']) {
      // Change request context to destination dir:
      //   require('./component.less'); // at src/components/hello/index.jsx
      // Could be transformed to:
      //   require('../../../dist/components/hello.less');
      // It can be useful when you prepare your assets in Gulpfile
      if (config['normalModuleReplacement']['useFromDestination']) {
        var configValue = config['normalModuleReplacement']['useFromDestination'];
        var testFunc = new RegExp(configValue);
        current.plugins.push(
          new webpack.NormalModuleReplacementPlugin(
            testFunc,
            function (request) {
              if (request.context.substr(0, sourceDir.length) === sourceDir) {
                gutil.log('webpack.normalModuleReplacement: ' + path.join(request.context, request.request));
                gutil.log('  replace context to: ' + path.join(
                  publicDir,
                  path.relative(sourceDir, request.context)
                ));
                request.context = path.join(
                  publicDir,
                  path.relative(sourceDir, request.context)
                );
              }
            }
          )
        );
      }
      // Replace file extensions:
      //   require('./component.less');
      // Could be transformed to:
      //   require('./component.css');
      // It also can be useful when you prepare your assets in Gulpfile
      if (config['normalModuleReplacement']['replaceExtensions']) {
        var extensionsMap = config['normalModuleReplacement']['replaceExtensions'];
        current.plugins.push(
          new webpack.NormalModuleReplacementPlugin(
            new RegExp('\\.(' + Object.keys(extensionsMap).join('|') + ')$'),
            function (request) {
              var extName = path.extname(request.request);
              gutil.log('webpack.normalModuleReplacement: ' + path.join(request.context, request.request));
              gutil.log('  replace file extension to: ' + extensionsMap[extName.substr(1)]);
              request.request = request.request.replace(
                new RegExp(extName.replace(/\./g, '\\.') + '$'), // strip all dots ('.less' => '\.less$')
                '.' + extensionsMap[extName.substr(1)] // remove first dot ('.less' => 'less')
              );
            }
          )
        );
      }
    }
    if (config['longTermCaching']) {
      var AssetsWebpackPlugin = require('assets-webpack-plugin');
      current.output.filename = '[name]-[hash].js';
      current.plugins.push(
        new AssetsWebpackPlugin()
      );
    }
    // To use this feature run in console:
    // npm install html-webpack-plugin --save-dev
    if (config['generateHTML'] && current.target === 'web') {
      var HTMLWebpackPlugin = require('html-webpack-plugin');
      var options;
      if (typeof config['generateHTML'] === 'object') {
        options = config['generateHTML'];
        if (options.template) {
          if (!options.filename) {
            options.filename = options.template;
          }
          options.template = path.join(
            path.relative(config.root, sourceDir),
            options.template
          );
        }
        if (options.filename) {
          options.filename = path.join(
            path.relative(publicDir, destDir),
            options.filename
          );
        }
      }
      current.plugins.push(
        new HTMLWebpackPlugin(options)
      );
    }
    // App Cache
    if (config['appCache']) {
      //var AppCachePlugin = require('appcache-webpack-plugin');
      //current.plugins.push(
      //  new AppCachePlugin({
      //    cache: ['someOtherAsset.js'],
      //    network: null,
      //    fallback: ['failwhale.js']
      //  })
      //);
    }
    if (config['bowerComponents']) {
      // We have to connect external plugin to use bower components
      // which are contains multiple files in 'main'
      var BowerWebpackPlugin = require('bower-webpack-plugin');
      var options = {
        modulesDirectories: ['bower_components'],
        manifestFiles: ['bower.json', '.bower.json'],
        excludes: /.*\.less$/,
        searchResolveModulesDirectories: false
      };
      if (typeof config['bowerComponents'] === 'object') {
        var customs = config['bowerComponents'];
        objectAssign(options, customs);
        if (customs['excludes']) {
          options.excludes = new RegExp(customs['excludes']);
        }
      }
      current.plugins.push(
        new BowerWebpackPlugin(options)
      );
    }
  }
  gutil.log('Use webpack configurations:');
  Object.keys(configByTargets).forEach(function (target) {
    gutil.log(gutil.colors.cyan(target) + ': ' + gutil.colors.grey(JSON.stringify(configByTargets[target])));
  });
  // Create and return module instance
  return {
    build: function (cb) {
      var configList = Object.keys(configByTargets).map(function (key) {
        return configByTargets[key];
      });
      var webpackInstance = webpack(configList);
      webpackInstance.run(function (err, stats) {
        if (err) {
          throw new gutil.PluginError('build:' + this.name, err);
        }
        gutil.log(stats.toString({
          colors: true,
          hash: true,
          timings: true
        }));
        cb();
      });
    },
    watch: function (cb) {
      if (config['devServer']) {
        var useHMR = config['devServer']['hotModuleReplacement'];
        var devServerHost = config['devServer']['host'] || 'localhost';
        var devServerPort = config['devServer']['port'] || 3000;
        var configList = Object.keys(configByTargets).map(function (key) {
          if (key === 'web') {
            if (useHMR && config['devServer']['reactHotLoader']) {
              // add <devServerEntry> to each entry
              var devServerEntry = [
                'webpack-dev-server/client?http://' + devServerHost + ':' + devServerPort,
                'webpack/hot/dev-server'
              ];
              if (typeof configByTargets[key].entry === 'string') {
                configByTargets[key].entry = devServerEntry.concat(
                  configByTargets[key].entry
                );
              } else {
                var entry = configByTargets[key].entry;
                Object.keys(entry).forEach(function (key) {
                  entry[key] = devServerEntry.concat(
                    entry[key]
                  );
                });
              }
              // add react-hot-loader for masks which contains ".jsx"
              // @todo include *.js?
              configByTargets[key].module.loaders.forEach(function (desc) {
                var mask = (desc.test instanceof RegExp) ? desc.test.toString() : desc.test;
                if (/(\.|\(|\|)jsx/.test(mask)) {
                  if (Array.isArray(desc.loaders)) {
                    desc.loaders.unshift('react-hot');
                  } else {
                    desc.loaders = ['react-hot', desc.loader];
                    delete desc.loader;
                  }
                }
              });
              // add HMR-plugin
              configByTargets[key].plugins.push(
                new webpack.HotModuleReplacementPlugin(),
                new webpack.NoErrorsPlugin()
              );
              gutil.log('Apply updates for Hot Module Replacement feature:');
              gutil.log(gutil.colors.grey(JSON.stringify(configByTargets[key])));
            }
          }
          return configByTargets[key];
        });
        var webpackInstance = webpack(configList);
        var webpackDevServer = new WebpackDevServer(webpackInstance, {
          publicPath: configByTargets['web'].output.publicPath,
          contentBase: config.directories['public'],
          hot: useHMR,
          historyApiFallback: true
        });
        webpackDevServer.listen(
          devServerPort,
          devServerHost,
          function (err, result) {
            if (err) {
              gutil.log(gutil.colors.red(err));
            }
            var serverURL = 'http://' +
              (config['devServer']['host'] || 'localhost') + ':' +
              (config['devServer']['port'] || 3000);
            gutil.log(
              gutil.colors.yellow('webpack-dev-server') +
              ': Listening at ' + gutil.colors.white(serverURL) + '...'
            );
            cb();
          }
        );
      } else {
        cb();
      }
    }
  };
};

module.exports = _factory;
