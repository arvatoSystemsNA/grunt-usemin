'use strict';
const assert = require('assert');
const helpers = require('./helpers');
const Flow = require('../lib/flow.js');
const ConfigWriter = require('../lib/configwriter.js');

describe('ConfigWriter', function () {
  before(helpers.directory('temp'));

  describe('constructor', function () {
    it('should check its input');

    it('should allow for user-defined steps per block type', function () {
      const copy = {
        name: 'copy',
        createConfig: function () {
          return {};
        }
      };

      const flow = new Flow({
        steps: {
          js: ['concat', 'uglify', copy]
        },
        post: {}
      });
      const cfgw = new ConfigWriter(flow, {
        input: 'app',
        dest: 'dist',
        staging: '.tmp'
      });
      const stepNames = [];
      cfgw.stepWriters('js').forEach(function (s) {
        stepNames.push(s.name);
      });
      assert.deepEqual(stepNames, ['concat', 'uglify', 'copy']);
    });

    it('should use in and out dirs');
  });

  describe('process', function () {
    const blocks = helpers.blocks();

    it('should check for input parameters');

    it('should output a set of config', function () {
      const flow = new Flow({
        steps: {
          js: ['concat', 'uglify']
        }
      });
      const file = helpers.createFile('foo', 'app', blocks);
      const c = new ConfigWriter(flow, {
        input: 'app',
        dest: 'dist',
        staging: '.tmp'
      });
      const config = c.process(file);
      const expected = helpers.normalize({
        concat: {
          generated: {
            files: [{
              dest: '.tmp/concat/scripts/site.js',
              src: ['app/foo.js', 'app/bar.js', 'app/baz.js']
            }]
          }
        },
        uglify: {
          generated: {
            files: [{
              dest: 'dist/scripts/site.js',
              src: ['.tmp/concat/scripts/site.js']
            }]
          }
        }
      });

      assert.deepEqual(config, expected);
    });

    it('should have a configurable destination directory', function () {
      const flow = new Flow({
        steps: {
          js: ['concat', 'uglify']
        }
      });

      const file = helpers.createFile('foo', 'app', blocks);
      const c = new ConfigWriter(flow, {
        input: 'app',
        dest: 'destination',
        staging: '.tmp'
      });
      const config = c.process(file);
      const expected = helpers.normalize({
        concat: {
          generated: {
            files: [{
              dest: '.tmp/concat/scripts/site.js',
              src: ['app/foo.js', 'app/bar.js', 'app/baz.js']
            }]
          }
        },
        uglify: {
          generated: {
            files: [{
              dest: 'destination/scripts/site.js',
              src: ['.tmp/concat/scripts/site.js']
            }]
          }
        }
      });

      assert.deepEqual(config, expected);
    });

    it('should have a configurable staging directory', function () {
      const flow = new Flow({
        steps: {
          js: ['concat', 'uglify']
        }
      });

      const file = helpers.createFile('foo', 'app', blocks);
      const c = new ConfigWriter(flow, {
        input: 'app',
        dest: 'dist',
        staging: 'staging'
      });
      const config = c.process(file);
      const expected = helpers.normalize({
        concat: {
          generated: {
            files: [{
              dest: 'staging/concat/scripts/site.js',
              src: ['app/foo.js', 'app/bar.js', 'app/baz.js']
            }]
          }
        },
        uglify: {
          generated: {
            files: [{
              dest: 'dist/scripts/site.js',
              src: ['staging/concat/scripts/site.js']
            }]
          }
        }
      });

      assert.deepEqual(config, expected);
    });

    it('should allow for single step flow', function () {
      const flow = new Flow({
        steps: {
          js: ['uglify']
        }
      });

      const file = helpers.createFile('foo', 'app', blocks);
      const c = new ConfigWriter(flow, {
        input: 'app',
        dest: 'dist',
        staging: 'staging'
      });
      const config = c.process(file);
      const expected = helpers.normalize({
        uglify: {
          generated: {
            files: [{
              dest: 'dist/scripts/site.js',
              src: ['app/foo.js', 'app/bar.js', 'app/baz.js']
            }]
          }
        }
      });
      assert.deepEqual(config, expected);
    });

    it('should allow for a configuration of the flow\'s step order', function () {
      const flow = new Flow({
        steps: {
          js: ['uglify', 'concat']
        }
      });

      const file = helpers.createFile('foo', 'app', blocks);
      const c = new ConfigWriter(flow, {
        input: 'app',
        dest: 'dist',
        staging: 'staging'
      });
      const config = c.process(file);
      const expected = helpers.normalize({
        uglify: {
          generated: {
            files: [{
              dest: 'staging/uglify/foo.js',
              src: ['app/foo.js']
            }, {
              dest: 'staging/uglify/bar.js',
              src: ['app/bar.js']
            }, {
              dest: 'staging/uglify/baz.js',
              src: ['app/baz.js']
            }]
          }
        },
        concat: {
          generated: {
            files: [{
              dest: 'dist/scripts/site.js',
              src: ['staging/uglify/foo.js', 'staging/uglify/bar.js', 'staging/uglify/baz.js']
            }]
          }
        }
      });
      assert.deepEqual(config, expected);
    });

    it('should augment the furnished config', function () {
      const flow = new Flow({
        steps: {
          js: ['concat', 'uglify']
        }
      });
      let config = {
        concat: {
          misc: {
            'foo.js': 'bar.js'
          }
        }
      };
      const file = helpers.createFile('foo', 'app', blocks);
      const c = new ConfigWriter(flow, {
        input: 'app',
        dest: 'destination',
        staging: '.tmp'
      });
      config = c.process(file, config);
      const expected = helpers.normalize({
        concat: {
          generated: {
            files: [{
              dest: '.tmp/concat/scripts/site.js',
              src: ['app/foo.js', 'app/bar.js', 'app/baz.js']
            }]
          },
          misc: {
            'foo.js': 'bar.js'
          }
        },
        uglify: {
          generated: {
            files: [{
              dest: 'destination/scripts/site.js',
              src: ['.tmp/concat/scripts/site.js']
            }]
          }
        }
      });
      assert.deepEqual(config, expected);
    });
    it('should allow for a flow per block type');
    it('should allow for an empty flow');
    it('should allow for a filename as input');

    it('should deduplicate blocks', function () {
      const flow = new Flow({
        steps: {
          js: ['concat', 'uglify']
        }
      });
      const doubleBlocks = [blocks[0], blocks[0]];
      const file = helpers.createFile('foo', 'app', doubleBlocks);
      const c = new ConfigWriter(flow, {
        input: 'app',
        dest: 'dist',
        staging: '.tmp'
      });
      const config = c.process(file);
      const expected = helpers.normalize({
        concat: {
          generated: {
            files: [{
              dest: '.tmp/concat/scripts/site.js',
              src: ['app/foo.js', 'app/bar.js', 'app/baz.js']
            }]
          }
        },
        uglify: {
          generated: {
            files: [{
              dest: 'dist/scripts/site.js',
              src: ['.tmp/concat/scripts/site.js']
            }]
          }
        }
      });

      assert.deepEqual(config, expected);
    });
    it('should deduplicate blocks across files', function () {
      const flow = new Flow({
        steps: {
          js: ['concat', 'uglify']
        }
      });
      const file = helpers.createFile('foo', 'app', blocks);
      const c = new ConfigWriter(flow, {
        input: 'app',
        dest: 'dist',
        staging: '.tmp'
      });
      const firstConfig = c.process(file);
      const repeatConfig = c.process(file);
      const expectedFirst = helpers.normalize({
        concat: {
          generated: {
            files: [{
              dest: '.tmp/concat/scripts/site.js',
              src: ['app/foo.js', 'app/bar.js', 'app/baz.js']
            }]
          }
        },
        uglify: {
          generated: {
            files: [{
              dest: 'dist/scripts/site.js',
              src: ['.tmp/concat/scripts/site.js']
            }]
          }
        }
      });
      const expectedRepeat = helpers.normalize({
        concat: {
          generated: {}
        },
        uglify: {
          generated: {}
        }
      });

      assert.deepEqual(firstConfig, expectedFirst);
      assert.deepEqual(repeatConfig, expectedRepeat);
    });
    it('should throw with conflicting blocks', function () {
      const flow = new Flow({
        steps: {
          js: ['concat', 'uglify']
        }
      });
      const conflictBlock = {
        type: 'js',
        dest: 'scripts/site.js',
        searchPath: [],
        indent: '    ',
        src: [
          'foo.js',
          'bar.js',
          'baz.js',
          'fail.js'
        ],
        raw: [
          '    <!-- build:js scripts/site.js -->',
          '    <script src="foo.js"></script>',
          '    <script src="bar.js"></script>',
          '    <script src="baz.js"></script>',
          '    <script src="fail.js"></script>',
          '    <!-- endbuild -->'
        ]
      };
      const file = helpers.createFile('foo', 'app', [blocks[0], conflictBlock]);
      const c = new ConfigWriter(flow, {
        input: 'app',
        dest: 'dist',
        staging: '.tmp'
      });
      assert.throws(function () {
        c.process(file);
      });
    });

    describe('stepWriters', function () {
      it('should return all writers if called without block type', function () {
        const flow = new Flow({
          steps: {
            js: ['concat', 'uglify'],
            css: ['concat']
          }
        });
        const c = new ConfigWriter(flow, {
          input: 'app',
          dest: 'destination',
          staging: '.tmp'
        });
        const names = [];
        c.stepWriters().forEach(function (i) {
          names.push(i.name);
        });
        assert.deepEqual(names, ['concat', 'uglify']);
      });
    });

    it('should not add the same block multiple times though we call process() explicitly 2 times.', function () {
      const flow = new Flow({steps: {js: ['concat', 'uglify']}});

      const file = helpers.createFile('foo', 'app', blocks);
      const c = new ConfigWriter(flow, {input: 'app', dest: 'destination', staging: '.tmp'});
      let config = c.process(file);
      config = c.process(file, config); // This second process is intentional. Details are in issue #307.
      const expected = helpers.normalize({
        concat: {generated: {files: [
          {dest: '.tmp/concat/scripts/site.js', src: ['app/foo.js', 'app/bar.js', 'app/baz.js']}
        ]}},
        uglify: {generated: {files: [
          {dest: 'destination/scripts/site.js', src: ['.tmp/concat/scripts/site.js']}
        ]}}
      });

      assert.deepEqual(config, expected);
    });
  });
});
