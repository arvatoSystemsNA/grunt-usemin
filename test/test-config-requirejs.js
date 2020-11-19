'use strict';
const assert = require('assert');
const requirejsConfig = require('../lib/config/requirejs.js');
const helpers = require('./helpers');

const block = {
  type: 'js',
  dest: 'scripts/amd-app.js',
  requirejs: {
    dest: 'scripts/amd-app.js',
    baseUrl: 'scripts',
    name: 'main',
    origScript: 'foo/require.js',
    src: 'foo/require.js'
  },
  src: [
    'foo/require.js'
  ],
  raw: [
    '<!-- build:js scripts/amd-app.js -->',
    '<script data-main="scripts/main" src="foo/require.js"></script>',
    '<!-- endbuild -->'
  ]
};

const blockWithoutRequirejs = {
  type: 'js',
  dest: 'scripts/amd-app.js',
  src: [
    'foo/require.js'
  ],
  raw: [
    '<!-- build:js scripts/amd-app.js -->',
    '<script data-main="scripts/main" src="foo/require.js"></script>',
    '<!-- endbuild -->'
  ]
};


describe('Requirejs config write', function () {
  it('should use the input files correctly', function () {
    const ctx = {
      inDir: 'zzz',
      inFiles: ['foo.js'],
      outDir: 'tmp/requirejs',
      outFiles: []
    };
    const cfg = requirejsConfig.createConfig(ctx, block);
    assert.deepEqual(cfg, helpers.normalize({
      'default': {
        options: {
          name: 'main',
          out: 'tmp/requirejs/scripts/amd-app.js',
          baseUrl: 'zzz/scripts',
          mainConfigFile: 'zzz/scripts/main.js'
        }
      }
    }));
  });

  it('should do nothing if the block is not requirejs enabled', function () {
    const ctx = {
      inDir: 'zzz',
      inFiles: ['foo.js'],
      outDir: 'tmp/requirejs',
      outFiles: []
    };
    const cfg = requirejsConfig.createConfig(ctx, blockWithoutRequirejs);
    assert.deepEqual(cfg, {});
  });

  it('should add a .js when needed to mainConfigFile', function () {
    const ctx = {
      inDir: 'zzz',
      inFiles: ['foo.js'],
      outDir: 'tmp/requirejs',
      outFiles: []
    };
    const cfg = requirejsConfig.createConfig(ctx, block);
    assert.equal(cfg['default'].options.mainConfigFile, helpers.normalize('zzz/scripts/main.js'));
  });

  it('should treat multi-config requirejs');
});
