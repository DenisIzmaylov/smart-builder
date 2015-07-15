# [Gulp] Smart Builder

[![Build Status](http://img.shields.io/travis/DenisIzmaylov/gulp-smart-builder/master.svg?style=flat-square)](http://travis-ci.org/DenisIzmaylov/gulp-smart-builder)

> Stop writing a lot code in gulpfile.js for every project.
> Stop thinking about gulp plugins and its versions.
> Turn on best practicies in your gulpfile in a few lines with Smart Builder. 
> Do it as short as it possible.
> But use custom logic where you really need it.

## Overview

Smart Builder is configuration wrapper for [gulp](https://github.com/gulpjs/gulp) which provide easy declarative configuration based on best practices. Configure your favorite build environment (PostCSS, template engines, webpack, Browserify, babel, etc) just in 3 minutes.

### Table of Content
 * [Features](#features)
 * [Installation](#installation)
 * [Quick Start](#quick-start)
 * [Configuration](#configuration)
 * [Troubleshooting](#troubleshooting)
 * [TODO](#TODO)

## Features

Not described yet.

## Installation

Just install to your project through npm:
```bash
npm install smart-builder --save-dev
```

## Quick Start

### package.json

```javascript
{
  "name": "my-app",
  "version": "1.0.0",
  "main": "src/server.js",
  "directories": {
    "source": "src",
    "destination": "dist",
    "public": "dist/assets"
  }
}
```

### gulpfile.babel.js

```javascript
import gulp from 'gulp';
import packageConfig from './package.json';
import SmartBuilder from 'smart-builder';

const builder = new SmartBuilder({
  root: __dirname,
  gulp: gulp,
  // `directories` contains keys "source", "destination" and "public"
  // which present a relative path according root of your project
  directories: packageConfig['directories'],
  // `config` should contain a map with asset (plugin name) as a key  
  // and options for this plugin as a value, see build.config.js
  config: {
    images: true,
    styles: true,
    templates: true,
    webpack: {
      dependencies: ['images', 'styles', 'swf', 'templates'],
      configFile: './webpack.config.js',
      entry: {
        'index': './app-client.js',
        'server': {
          target: 'node',
          file: './app-server.js'
        }
      },
      publicPath: '/assets'
    }
  }
});

builder.run();
```

## Configuration

It's a good practice to store your configuration in external file (like `webpack.config.js`):

### smart-builder.config.js

```javascript
import objectAssignDeep from 'object-assign-deep';

const config = {
  images: {
    // Process only changed files (with compare to destination directory)
    // implemented by gulp-changed plugin
    changed: true
  },
  styles: {
    changed: true
  },
  swf: true,
  templates: {
    changed: true
  },
  webpack: {
    // Start only when this assets has been processed
    dependencies: ['images', 'styles', 'swf', 'templates'],
    // Connect external webpack config
    configFile: './webpack.config.js',
    entry: {
      'index': './app-client.js',
      'server': {
        target: 'node',
        file: './app-server.js'
      }
    },
    publicPath: '/assets',
    sourceMaps: 'inline',
    devServer: {
      hotModuleReplacement: true,
      reactHotLoader: true,
      host: 'localhost',
      port: 3000
    },
    extractCSSToFile: false,
    longTermCaching: false,
    generateHTML: {
      template: './templates/pages/index.html',
      inject: true
    },
    bowerComponents: true
  }
};

// Override configuration settings for PRODUCTION environment
if (process.env.NODE_ENV === 'production') {
  objectAssignDeep(config, {
    images: {
      changed: false,
      imagemin: true
    },
    styles: {
      changed: false,
      minify: true,
      sourceMaps: 'external'
    },
    templates: {
      changed: false,
      htmlmin: true
    },
    webpack: {
      uglify: true,
      sourceMaps: 'external',
      generateHTML: {
        minify: true
      }
  });
}

export default config;
```

## Troubleshooting

### Watch mode with webpack-dev-server on MacOS X running with high CPU usage

Try to install [fs-events](https://github.com/strongloop/fsevents) module:
```bash
npm install fs-events
```

## TODO
 
 * Middleware
 * Look at [Ember CLI](http://www.ember-cli.com/user-guide/) and [LinemanJS](http://linemanjs.com/) for inspiration and to get useful solutions. Thanks to [Andrey Listochkin](https://github.com/listochkin).
