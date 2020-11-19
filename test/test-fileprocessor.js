'use strict';
const assert = require('assert');
const helpers = require('./helpers');
const FileProcessor = require('../lib/fileprocessor.js');

describe('FileProcessor', function () {
  describe('constructor', function () {
    it('should fail if no type is furnished', function () {
      assert.throws(function () {
        new FileProcessor();
      }, /No type given/);
    });

    it('should accept a pattern name', function () {
      const fp = new FileProcessor('html', [], {});
      assert.ok(fp);
    });

    it('should fail if pattern is not an array', function () {
      assert.throws(function () {
        new FileProcessor('html', {});
      }, /Patterns must be an array/);
    });

    it('should accept a custom pattern', function () {
      const foo = ['bar'];
      const fp = new FileProcessor('html', foo, {});
      assert.ok(fp);
      assert.notEqual(fp.patterns.indexOf(foo[0]), -1);
    });

    it('should fail if no finder is furnished', function () {
      assert.throws(function () {
        new FileProcessor('html', []);
      }, /Missing parameter: finder/);
    });
  });

  describe('replaceBlocks', function () {
    it('should replace block with the right expression', function () {
      const fp = new FileProcessor('html', [], {});
      fp.replaceWith = function () {
        return 'foo';
      };
      const file = {
        content: 'foo\nbar\nbaz\n',
        blocks: [{
          raw: ['bar', 'baz']
        }]
      };
      const result = fp.replaceBlocks(file);
      assert.equal(result, 'foo\nfoo\n');
    });
  });

  describe('replaceWith', function () {
    it('should replace css blocks with a link to a stylesheet', function () {
      const fp = new FileProcessor('html', [], {});
      const block = {
        dest: 'foo.css',
        type: 'css',
        src: ['bar.css'],
        indent: '  '
      };

      const result = fp.replaceWith(block);
      assert.equal(result, '  <link rel="stylesheet" href="foo.css">');
    });

    it('should remove css blocks which have no stylesheets linked in them', function () {
      const fp = new FileProcessor('html', [], {});
      const block = {
        dest: 'foo.css',
        type: 'css',
        src: [],
        indent: '  '
      };

      const result = fp.replaceWith(block);
      assert.equal(result, '');
    });

    it('should replace js blocks with a link to a javascript file', function () {
      const fp = new FileProcessor('html', [], {});
      const block = {
        dest: 'foo.js',
        type: 'js',
        src: ['bar.js'],
        indent: '  '
      };

      const result = fp.replaceWith(block);
      assert.equal(result, '  <script src="foo.js"><\/script>');
    });

    it('should remove js blocks which have no javascripts linked in the block', function () {
      const fp = new FileProcessor('html', [], {});
      const block = {
        dest: 'foo.js',
        type: 'js',
        src: [],
        indent: '  '
      };

      const result = fp.replaceWith(block);
      assert.equal(result, '');
    });

    it('should replace custom blocks using provided replacement function', function () {
      const blockReplacements = {
        less: function (block) {
          return 'custom replacement for ' + block.dest;
        }
      };
      const fp = new FileProcessor('html', [], {}, function () {}, blockReplacements);
      const block = {
        dest: 'foo.css',
        type: 'less',
        src: ['bar.less'],
        indent: '  '
      };

      const result = fp.replaceWith(block);
      assert.equal(result, '  custom replacement for foo.css');
    });

    it('should preserve defer attribute (JS)', function () {
      const fp = new FileProcessor('html', [], {});
      const block = {
        dest: 'foo.js',
        type: 'js',
        src: ['bar.js'],
        defer: true,
        indent: '  '
      };

      const result = fp.replaceWith(block);
      assert.equal(result, '  <script defer src="foo.js"><\/script>');
    });

    it('should preserve async attribute (JS)', function () {
      const fp = new FileProcessor('html', [], {});
      const block = {
        dest: 'foo.js',
        type: 'js',
        src: ['bar.js'],
        async: true,
        indent: '  '
      };

      const result = fp.replaceWith(block);
      assert.equal(result, '  <script async src="foo.js"><\/script>');
    });

    it('should preserve media attribute', function () {
      const fp = new FileProcessor('html', [], {});
      const block = {
        dest: 'foo.css',
        type: 'css',
        src: ['bar.css'],
        media: '(min-width:980px)',
        indent: '  '
      };

      const result = fp.replaceWith(block);
      assert.equal(result, '  <link rel="stylesheet" href="foo.css" media="(min-width:980px)">');
    });

    it('should preserve IE conditionals for js blocks', function () {
      const fp = new FileProcessor('html', [], {});
      const block = {
        dest: 'foo.js',
        type: 'js',
        src: ['bar.js'],
        conditionalStart: '<!--[if (lt IE 9) & (!IEmobile)]>',
        conditionalEnd: '<![endif]-->',
        indent: '  '
      };

      const result = fp.replaceWith(block);
      assert.equal(result, '  <!--[if (lt IE 9) & (!IEmobile)]>\n  <script src="foo.js"><\/script>\n  <![endif]-->');
    });

    it('should preserve IE conditionals for css blocks', function () {
      const fp = new FileProcessor('html', [], {});
      const block = {
        dest: 'foo.css',
        type: 'css',
        src: ['bar.css'],
        conditionalStart: '<!--[if (lt IE 9) & (!IEmobile)]>',
        conditionalEnd: '<![endif]-->',
        indent: '  '
      };

      const result = fp.replaceWith(block);
      assert.equal(result, '  <!--[if (lt IE 9) & (!IEmobile)]>\n  <link rel="stylesheet" href="foo.css">\n  <![endif]-->');
    });
  });

  describe('replaceWithRevved', function () {
    it('should use furnished pattern to replace match with reference to revved files', function () {
      const pattern = [
        [/(foo\d+)/g, 'Replaced numerical foo']
      ];

      const finder = {
        find: function () {
          return 'toto';
        }
      };
      const fp = new FileProcessor('html', pattern, finder);
      const content = 'bar\nfoo12345\nfoo8979\nbaz\n';
      const result = fp.replaceWithRevved(content, ['']);

      assert.equal(result, 'bar\ntoto\ntoto\nbaz\n');
    });
    // FIXME: add tests on the filterIn / filterOut stuff
  });

  describe('process', function () {
    it('should call replaceWithRevved with the right arguments');
  });

  describe('html type', function () {
    let fp;
    const filemapping = {
      'foo.js': 'foo.1234.js',
      '/foo.js': '/foo.1234.js',
      'app/bar.css': 'bar.5678.css',
      'app/baz.css': '/baz.8910.css',
      'app/image.png': 'image.1234.png',
      'app/image@2x.png': 'image@2x.1234.png',
      'app/video.webm': 'video.1234.webm',
      'tmp/bar.css': 'bar.1234.css',
      'app/foo.js': 'foo.1234.js',
      '/styles/main.css': '/styles/main.1234.css',
      'app/image.svg': 'image.1234.svg'
    };

    const revvedfinder = helpers.makeFinder(filemapping);

    beforeEach(function () {
      fp = new FileProcessor('html', [], revvedfinder);
    });

    it('should not replace file if no revved version is found', function () {
      const content = '<script src="bar.js"></script>';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<script src="bar.js"></script>');
    });

    it('should not treat file reference that are coming from templating', function () {
      const content = '<script src="<% my_func() %>"></script>';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<script src="<% my_func() %>"></script>');
    });

    it('should not replace external references', function () {
      const content = '<script src="http://bar/foo.js"></script>';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<script src="http://bar/foo.js"></script>');
    });

    it('should not add .js to data-main for requirejs', function () {
      const content = '<script data-main="bar" src="require.js"></script>';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<script data-main="bar" src="require.js"></script>');
    });


    describe('absolute paths', function () {
      let fp;

      beforeEach(function () {
        fp = new FileProcessor('html', [], revvedfinder);
      });

      it('should replace file referenced from root', function () {
        const replaced = fp.replaceWithRevved('<link rel="stylesheet" href="/styles/main.css"/>', ['']);
        assert.equal(replaced, '<link rel="stylesheet" href="/styles/main.1234.css"/>');
      });

      it('should not replace the root (i.e /)', function () {
        const content = '<script src="/"></script>';
        const replaced = fp.replaceWithRevved(content, ['']);

        assert.equal(replaced, '<script src="/"></script>');
      });

      it('should replace accept additional parameters to script', function () {
        const content = '<script src="foo.js" type="text/javascript"></script>';
        const replaced = fp.replaceWithRevved(content, ['']);
        assert.equal(replaced, '<script src="' + filemapping['foo.js'] + '" type="text/javascript"></script>');
      });

      it('should allow for several search paths', function () {
        const content = '<script src="foo.js" type="text/javascript"></script><link rel="stylesheet" href="/baz.css"><link rel="stylesheet" href="/baz.css"/>';
        const replaced = fp.replaceWithRevved(content, ['app', 'tmp']);

        assert.ok(replaced.match(/<link rel="stylesheet" href="\/baz\.8910\.css"\/>/));
        assert.ok(replaced.match(/<link rel="stylesheet" href="\/baz\.8910\.css">/));
        assert.ok(replaced.match(/<script src="foo\.1234\.js" type="text\/javascript"><\/script>/));
      });
    });

    describe('relative paths', function () {
      let fp;

      beforeEach(function () {
        fp = new FileProcessor('html', [], revvedfinder);
      });

      it('should replace script source with revved version', function () {
        const content = '<script src="foo.js"></script>';
        const replaced = fp.replaceWithRevved(content, ['']);
        assert.equal(replaced, '<script src="' + filemapping['foo.js'] + '"></script>');
      });

      it('should replace accept additional parameters to script', function () {
        const content = '<script src="foo.js" type="text/javascript"></script>';
        const replaced = fp.replaceWithRevved(content, ['']);
        assert.equal(replaced, '<script src="' + filemapping['foo.js'] + '" type="text/javascript"></script>');
      });
    });

    it('should replace CSS reference with revved version', function () {
      let content = '<link rel="stylesheet" href="bar.css">';
      let replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<link rel="stylesheet" href="bar.5678.css">');
      content = '<link rel="stylesheet" href="bar.css"/>';
      replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<link rel="stylesheet" href="bar.5678.css"/>');
    });

    it('should replace img reference with revved version', function () {
      const content = '<img src="image.png">';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<img src="' + filemapping['app/image.png'] + '">');
    });

    it('should replace object data reference with revved version', function () {
      const content = '<object type="image/svg+xml" data="image.svg">';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<object type="image/svg+xml" data="' + filemapping['app/image.svg'] + '">');
    });

    it('should replace image xlink:href reference with revved version', function () {
      const content = '<image xlink:href="image.svg">';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<image xlink:href="' + filemapping['app/image.svg'] + '">');
    });

    it('should replace image src reference with revved version', function () {
      const content = '<image src="image.png">';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<image src="' + filemapping['app/image.png'] + '">');
    });

    it('should replace img src regardless of ng-src attribute', function () {
      const content = '<img src="image.png" ng-src="{{my.image}}">';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<img src="' + filemapping['app/image.png'] + '" ng-src="{{my.image}}">');
    });

    it('should replace img src after class attribute', function () {
      const content = '<img class="myclass" src="image.png">';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<img class="myclass" src="' + filemapping['app/image.png'] + '">');
    });

    it('should replace video reference with revved version', function () {
      const content = '<video src="video.webm">';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<video src="' + filemapping['app/video.webm'] + '">');
    });

    it('should replace source reference with revved version', function () {
      const content = '<source src="video.webm">';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<source src="' + filemapping['app/video.webm'] + '">');
    });

    it('should replace videos\'s poster with revved version', function () {
      const content = '<video poster="image.png">';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<video poster="' + filemapping['app/image.png'] + '">');
    });

    it('should replace data reference with revved version', function () {
      const content = '<li data-lang="fr" data-src="image.png"></li>';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<li data-lang="fr" data-src="' + filemapping['app/image.png'] + '"></li>');
    });

    it('should replace image reference in inlined style', function () {
      const content = '<li style="background: url("image.png");"></li>';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<li style="background: url("' + filemapping['app/image.png'] + '");"></li>');
    });

    it('should replace unquoted image reference in inlined style', function () {
      const content = '<li style="background: url(image.png);"></li>';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<li style="background: url(' + filemapping['app/image.png'] + ');"></li>');
    });

    it('should replace image reference in anchors', function () {
      const content = '<a href="image.png"></a>';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<a href="' + filemapping['app/image.png'] + '"></a>');
    });

    it('should replace image reference in input', function () {
      const content = '<input type="image" src="image.png" />';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<input type="image" src="' + filemapping['app/image.png'] + '" />');
    });

    it('should replace img in meta content', function () {
      const content = '<meta name="foo" content="image.png">';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<meta name="foo" content="' + filemapping['app/image.png'] + '">');
    });

    it('should replace img reference in srcset', function () {
      const content = '<img srcset="image.png" />';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<img srcset="' + filemapping['app/image.png'] + '" />');
    });

    it('should replace img reference in srcset with pixel density descriptor', function () {
      const content = '<img srcset="image@2x.png 2x" />';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<img srcset="' + filemapping['app/image@2x.png'] + ' 2x" />');
    });

    it('should replace img reference in srcset with width descriptor', function () {
      const content = '<img srcset="image.png 200w" />';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<img srcset="' + filemapping['app/image.png'] + ' 200w" />');
    });

    it('should replace img reference in srcset with pixel density descriptor and with width descriptor', function () {
      const content = '<img srcset="image.png 200w 2x" />';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<img srcset="' + filemapping['app/image.png'] + ' 200w 2x" />');
    });

    it('should replace source reference in srcset', function () {
      const content = '<source srcset="image.png" />';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<source srcset="' + filemapping['app/image.png'] + '" />');
    });

    it('should replace source reference in srcset with pixel density descriptor', function () {
      const content = '<source srcset="image@2x.png 2x" />';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<source srcset="' + filemapping['app/image@2x.png'] + ' 2x" />');
    });

    it('should replace source reference in srcset with width descriptor', function () {
      const content = '<source srcset="image.png 200w" />';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<source srcset="' + filemapping['app/image.png'] + ' 200w" />');
    });

    it('should replace source reference in srcset with pixel density descriptor and with width descriptor', function () {
      const content = '<source srcset="image.png 200w 2x" />';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<source srcset="' + filemapping['app/image.png'] + ' 200w 2x" />');
    });

    it('should replace svg src reference with revved version for img tag', function () {
      const content = '<img src="image.svg#symbol">';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<img src="' + filemapping['app/image.svg'] + '#symbol">');
    });

    it('should replace svg src reference with revved version for image tag', function () {
      const content = '<image src="image.svg#symbol">';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<image src="' + filemapping['app/image.svg'] + '#symbol">');
    });

    it('should replace use xlink:href reference with revved version for svg <use> tag', function () {
      const content = '<svg><use xlink:href="image.svg#symbol"></svg>';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<svg><use xlink:href="' + filemapping['app/image.svg'] + '#symbol"></svg>');
    });

    it('should replace image xlink:href reference with revved version for svg <image> tag', function () {
      const content = '<svg><image xlink:href="image.svg#symbol"></svg>';
      const replaced = fp.replaceWithRevved(content, ['app']);
      assert.equal(replaced, '<svg><image xlink:href="' + filemapping['app/image.svg'] + '#symbol"></svg>');
    });
  });

  describe('css type', function () {
    let cp;

    describe('absolute path', function () {
      const content = '.myclass {\nbackground: url("/images/test.png") no-repeat center center;\nbackground: url("/images/misc/test.png") no-repeat center center;\nbackground: url("//images/foo.png") no-repeat center center;\nfilter: progid:DXImageTransform.Microsoft.AlphaImageLoader(src="images/pic.png",sizingMethod="scale");}';
      const filemapping = {
        'build/images/test.png': '/images/test.23012.png',
        'build/images/foo.png': '//images/foo.23012.png',
        'build/images/misc/test.png': '/images/misc/test.23012.png',
        'foo/images/test.png': '/images/test.23012.png',
        'foo/images/foo.png': '//images/foo.23012.png',
        'foo/images/pic.png': '/images/pic.23012.png',
        'foo/images/misc/test.png': '/images/misc/test.23012.png'
      };

      const revvedfinder = helpers.makeFinder(filemapping);

      beforeEach(function () {
        cp = new FileProcessor('css', [], revvedfinder);
      });

      it('should replace with revved files when found', function () {
        const changed = cp.replaceWithRevved(content, ['build']);
        assert.ok(changed.match(/\/images\/test\.23012\.png/));
        assert.ok(changed.match(/\/images\/misc\/test\.23012\.png/));
        assert.ok(changed.match(/\/\/images\/foo\.23012\.png/));
      });

      it('should take into account alternate search paths', function () {
        const changed = cp.replaceWithRevved(content, ['foo']);

        assert.ok(changed.match(/\/images\/test\.23012\.png/));
        assert.ok(changed.match(/\/images\/misc\/test\.23012\.png/));
        assert.ok(changed.match(/\/\/images\/foo\.23012\.png/));
      });

      it('should take into account src attribute', function () {
        const changed = cp.replaceWithRevved(content, ['foo']);

        assert.ok(changed.match(/\/images\/pic\.23012\.png/));
        assert.ok(changed.match(/\/images\/misc\/test\.23012\.png/));
        assert.ok(changed.match(/\/\/images\/foo\.23012\.png/));
      });
    });

    describe('relative path', function () {
      const content = '.myclass {\nbackground: url("images/test.png") no-repeat center center;\nbackground: url("../images/misc/test.png") no-repeat center center;\nbackground: url("images/foo.png") no-repeat center center;}';
      const filemapping = {
        'build/images/test.png': 'images/test.23012.png',
        'build/images/foo.png': 'images/foo.23012.png',
        'images/misc/test.png': '../images/misc/test.23012.png',
        'foo/images/test.png': 'images/test.23012.png',
        'foo/images/foo.png': 'images/foo.23012.png'
      };

      const revvedfinder = helpers.makeFinder(filemapping);

      beforeEach(function () {
        cp = new FileProcessor('css', [], revvedfinder);
      });

      it('should replace with revved files when found', function () {
        const changed = cp.replaceWithRevved(content, ['build']);

        assert.ok(changed.match(/\"images\/test\.23012\.png/));
        assert.ok(changed.match(/\"\.\.\/images\/misc\/test\.23012\.png/));
        assert.ok(changed.match(/\"images\/foo\.23012\.png/));
      });

      it('should take into account alternate search paths', function () {
        const changed = cp.replaceWithRevved(content, ['foo']);

        assert.ok(changed.match(/\"images\/test\.23012\.png/));
        assert.ok(changed.match(/\"\.\.\/images\/misc\/test\.23012\.png/));
        assert.ok(changed.match(/\"images\/foo\.23012\.png/));
      });
    });

    describe('font path', function () {
      const content = '@font-face {\nfont-family:"icons";\nsrc:url("/styles/fonts/icons.eot");\nsrc:url("/styles/fonts/icons.eot?#iefix") format("embedded-opentype"),\nurl("/styles/fonts/icons.woff") format("woff"),\nurl("/styles/fonts/icons.ttf") format("truetype"),\nurl("/styles/fonts/icons.svg?#icons") format("svg");\nfont-weight:normal;\nfont-style:normal;\n}';
      const filemapping = {
        'build/styles/fonts/icons.eot': '/styles/fonts/icons.12345.eot',
        'build/styles/fonts/icons.woff': '/styles/fonts/icons.12345.woff',
        'build/styles/fonts/icons.ttf': '/styles/fonts/icons.12345.ttf',
        'build/styles/fonts/icons.svg': '/styles/fonts/icons.12345.svg'
      };

      const revvedfinder = helpers.makeFinder(filemapping);

      beforeEach(function () {
        cp = new FileProcessor('css', [], revvedfinder);
      });

      it('should replace but ignore querystrings on revved files when found', function () {
        const changed = cp.replaceWithRevved(content, ['build']);

        assert.ok(changed.match(/\/styles\/fonts\/icons\.12345\.eot/));
        assert.ok(changed.match(/\/styles\/fonts\/icons\.12345\.woff/));
        assert.ok(changed.match(/\/styles\/fonts\/icons\.12345\.ttf/));
        assert.ok(changed.match(/\/styles\/fonts\/icons\.12345\.svg/));
      });
    });

    describe('font path', function () {
      const content = '@font-face {\nfont-family:"icons";\nsrc:url("/styles/fonts/icons.eot");\nsrc:url("/styles/fonts/icons.eot#fragment") format("embedded-opentype"),\nurl("/styles/fonts/icons.woff") format("woff"),\nurl("/styles/fonts/icons.ttf") format("truetype"),\nurl("/styles/fonts/icons.svg#icons") format("svg");\nfont-weight:normal;\nfont-style:normal;\n}';
      const filemapping = {
        'build/styles/fonts/icons.eot': '/styles/fonts/icons.12345.eot',
        'build/styles/fonts/icons.woff': '/styles/fonts/icons.12345.woff',
        'build/styles/fonts/icons.ttf': '/styles/fonts/icons.12345.ttf',
        'build/styles/fonts/icons.svg': '/styles/fonts/icons.12345.svg'
      };

      const revvedfinder = helpers.makeFinder(filemapping);

      beforeEach(function () {
        cp = new FileProcessor('css', [], revvedfinder);
      });

      it('should replace but ignore querystrings on revved files when found', function () {
        const changed = cp.replaceWithRevved(content, ['build']);

        assert.ok(changed.match(/\/styles\/fonts\/icons\.12345\.eot/));
        assert.ok(changed.match(/\/styles\/fonts\/icons\.12345\.woff/));
        assert.ok(changed.match(/\/styles\/fonts\/icons\.12345\.ttf/));
        assert.ok(changed.match(/\/styles\/fonts\/icons\.12345\.svg/));
      });
    });
  });

  describe('json type', function () {
    let cp;

    describe('absolute path', function () {
      const content = '{"images1": "/build/images/test.png","images2": "/images/foo.png","images3": "/images/misc/test.png","images4": "/images/test.png","images5": "/images/foo.png","images6": "/images/pic.png","images7": "/images/misc/test.png"}';
      const filemapping = {
        'build/images/test.png': '/images/test.23012.png',
        'build/images/foo.png': '//images/foo.23012.png',
        'build/images/misc/test.png': '/images/misc/test.23012.png',
        'foo/images/test.png': '/images/test.23012.png',
        'foo/images/foo.png': '//images/foo.23012.png',
        'foo/images/pic.png': '/images/pic.23012.png',
        'foo/images/misc/test.png': '/images/misc/test.23012.png'
      };

      const revvedfinder = helpers.makeFinder(filemapping);

      beforeEach(function () {
        cp = new FileProcessor('json', [], revvedfinder);
      });

      it('should replace with revved files when found', function () {
        const changed = cp.replaceWithRevved(content, ['build']);

        assert.ok(changed.match(/\/images\/test\.23012\.png/));
        assert.ok(changed.match(/\/images\/misc\/test\.23012\.png/));
        assert.ok(changed.match(/\/\/images\/foo\.23012\.png/));
      });

      it('should take into account alternate search paths', function () {
        const changed = cp.replaceWithRevved(content, ['foo']);

        assert.ok(changed.match(/\/images\/test\.23012\.png/));
        assert.ok(changed.match(/\/images\/misc\/test\.23012\.png/));
        assert.ok(changed.match(/\/\/images\/foo\.23012\.png/));
      });

      it('should take into account src attribute', function () {
        const changed = cp.replaceWithRevved(content, ['foo']);

        assert.ok(changed.match(/\/images\/pic\.23012\.png/));
        assert.ok(changed.match(/\/images\/misc\/test\.23012\.png/));
        assert.ok(changed.match(/\/\/images\/foo\.23012\.png/));
      });
    });

    describe('relative path', function () {
      const content = '{"image1": "images/test.png""image2": "images/foo.png""image3": "../images/misc/test.png""image4": "images/test.png""image5": "images/foo.png"}';
      const filemapping = {
        'build/images/test.png': 'images/test.23012.png',
        'build/images/foo.png': 'images/foo.23012.png',
        'images/misc/test.png': '../images/misc/test.23012.png',
        'foo/images/test.png': 'images/test.23012.png',
        'foo/images/foo.png': 'images/foo.23012.png'
      };

      const revvedfinder = helpers.makeFinder(filemapping);

      beforeEach(function () {
        cp = new FileProcessor('json', [], revvedfinder);
      });

      it('should replace with revved files when found', function () {
        const changed = cp.replaceWithRevved(content, ['build']);

        assert.ok(changed.match(/\"images\/test\.23012\.png/));
        assert.ok(changed.match(/\"\.\.\/images\/misc\/test\.23012\.png/));
      });

      it('should take into account alternate search paths', function () {
        const changed = cp.replaceWithRevved(content, ['foo']);

        assert.ok(changed.match(/\"images\/test\.23012\.png/));
        assert.ok(changed.match(/\"\.\.\/images\/misc\/test\.23012\.png/));
      });
    });
  });
});
