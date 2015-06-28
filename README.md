# Gulp Smart Builder

[![Build Status](http://img.shields.io/travis/DenisIzmaylov/gulp-smart-builder/master.svg?style=flat-square)](http://travis-ci.org/DenisIzmaylov/gulp-smart-builder)

> Stop writing big gulpfile for every project! Stop thinking about gulp plugins and dependencies!
> Turn on best practicies in your gulpfile in a few lines with Gulp Smart Builder.

## Overview

Gulp Smart Builder is configuration wrapper for [gulp](https://github.com/gulpjs/gulp) which provide plugins managements is more clear and change aspect from 'which micro-steps and what order should be applied for assets' to 'which assets should be processed and what features should applied to it'.

### Table of Content

 * [Quick Start](#quick-start)
 * [Configuration](#configuration)

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
import buildConfig from './build.config';
import SmartBuilder from 'gulp-smart-builder';

const builder = new SmartBuilder({
  root: __dirname,
  gulp: gulp,
  // `directories` contains keys "source", "destination" and "public"
  // which present a relative path according root of your project
  directories: packageConfig['directories'],
  // `config` should contain a map with asset (plugin name) as a key  
  // and options for this plugin as a value, see build.config.js
  config: buildConfig
});
builder.run();
```

### build.config.js

```javascript
import objectAssignDeep from 'object-assign-deep';
let config = {
  images: {
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
    dependencies: ['images', 'styles', 'swf', 'templates'],
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

## Configuration

Not described yet.  
