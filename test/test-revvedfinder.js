'use strict';
const assert = require('assert');
const RevvedFinder = require('../lib/revvedfinder');
const helpers = require('./helpers');
const expandfn = function () {
  return [];
};

describe('RevvedFinder', function () {
  it('should initialize correctly', function () {
    const rf = new RevvedFinder(expandfn);
    assert.equal(expandfn, rf.expandfn);
  });

  it('should allow for a mapping or and expandfn');

  describe('expand function', function () {
    describe('find', function () {
      it('should return the file if it\'s external', function () {
        const rf = new RevvedFinder(expandfn);
        const rfile = rf.find('http://foo/bar.png');
        assert.equal('http://foo/bar.png', rfile);
      });

      it('should return the file if it references nothing', function () {
        const rf = new RevvedFinder(expandfn);
        const rfile = rf.find('');
        assert.equal('', rfile);
      });

      it('should return revved version of the given file', function () {
        const rf = new RevvedFinder(function () {
          return ['./image.2345.png'];
        });
        const rfile = rf.find('image.png', '.');
        assert.equal('image.2345.png', rfile);
      });

      it('should return revved version of the given file (prefix)', function () {
        const rf = new RevvedFinder(function () {
          return ['./2345.image.png'];
        });
        const rfile = rf.find('image.png', '.');
        assert.equal('2345.image.png', rfile);
      });

      // it('should pay attention to the full given path', function () {
      //   const rf = new RevvedFinder(function () {
      //     return ['./foo/bar/7345.image.png', './bar/2345.image.png'];
      //   });
      //   const rfile = rf.find('bar/image.png', '.');
      //   assert.equal(rfile, 'bar/2345.image.png');

      //   rf = new RevvedFinder(function () {
      //     return ['temp/7345.image.png', 'temp/bar/2345.image.png', 'temp/bar/baz/1234.image.png'];
      //   });
      //   const rfile = rf.find('bar/image.png', ['temp']);
      //   assert.equal('bar/2345.image.png', rfile);
      // });

      it('should regexp quote the looked-after file', function (done) {
        const rf = new RevvedFinder(function (pattern) {
          assert.deepEqual(['image.*.png', '*.image.png'], pattern);
          done();
          return [];
        });
        rf.find('image.png', '.');
      });

      it('should return revved version if it ends hex in characters', function () {
        const rf = new RevvedFinder(function () {
          return ['image.11916fba.png'];
        });
        const rfile = rf.find('image.png', '.');
        assert.equal(rfile, 'image.11916fba.png');
      });

      it('should return the file if no revved version is found', function () {
        const rf = new RevvedFinder(function () {
          return [];
        });
        const rfile = rf.find('foo.png', '.');
        assert.equal(rfile, 'foo.png');
      });

      // it('should return the file if not revved version is found (starting from root)', function () {
      //   const rf = new RevvedFinder(function () {
      //     return [];
      //   });
      //   assert.equal('/foo.png', rf.find('/foo.png', '.'));
      // });

      // it('should pay attention to the file starting at root', function () {
      //   const rf = new RevvedFinder(function () {
      //     return ['1234.foo.png'];
      //   });
      //   assert.equal('/1234.foo.png', rf.find('/foo.png', '.'));
      // });

      describe('absolute paths', function () {
        it('should return the revved file', function () {
          const rf = new RevvedFinder(function () {
            return ['bar/baz/foo.1234.png'];
          });
          const rfile = rf.find('/foo.png', 'bar/baz');
          assert.equal(rfile, '/foo.1234.png');
        });

        it('should look for the file in furnished search path', function () {
          const rf = new RevvedFinder(function () {
            return ['temp/bar/image.2345.png'];
          });
          const rfile = rf.find('/bar/image.png', ['temp']);
          assert.equal('/bar/image.2345.png', rfile);
        });

        it('should allow for several seach paths', function () {
          const rf = new RevvedFinder(function () {
            return ['foo/bar/image.2345.png'];
          });
          const rfile = rf.find('/bar/image.png', ['temp', 'foo']);
          assert.equal('/bar/image.2345.png', rfile);
        });
      });

      it('should only look under the furnished directory', function () {
        const rf = new RevvedFinder(function (pattern) {
          assert.deepEqual(pattern, [helpers.normalize('bar/fred.*.html'), helpers.normalize('bar/*.fred.html')]);
          return ['fred.html'];
        });
        const rfile = rf.find('fred.html', 'bar');
        assert.equal(rfile, 'fred.html');
      });


      it('should only look at revved files', function () {
        const rf = new RevvedFinder(function () {
          return ['bar-fred.html'];
        });
        const rfile = rf.find('fred.html', '.');
        assert.equal(rfile, 'fred.html');
      });

      // it('should restrict to the furnished subdirectories', function () {
      //   const rf = new RevvedFinder(function (pattern) {
      //     assert.equal(pattern, '{temp,dist}/**/*fred\\.html');
      //     return ['fred.html'];
      //   });
      //   rf.find('fred.html', '.');
      // });

      // it('should allow for a list of search paths', function () {
      //   const rf = new RevvedFinder(function (pattern) {
      //     assert.equal(pattern, '{temp,dist}/**/./*fred\\.html');
      //     return ['temp/./fred.html'];
      //   });
      //   const rfile = rf.find('fred.html', ['temp', 'dist']);
      //   assert.equal(rfile, 'temp/fred.html' );
      // });

      // it('should normalize relative paths', function () {
      //   const rf = new RevvedFinder(function (pattern) {
      //     // assert.equal(pattern, 'temp/**/images/*fred\\.html');
      //     // FIXME: We should match the above not the bellow
      //     assert.equal(pattern, 'temp/foo/**/../images/*fred\\.html');
      //     return ['fred.html'];
      //   });
      //   const rfile = rf.find('../images/fred.html', ['temp/foo']);
      //   assert.equal(rfile.base, '' );
      // });

      it('should return matching file as well as base directory', function () {
        let rf = new RevvedFinder(function () {
          return ['temp/./fred.2323.html'];
        });
        let rfile = rf.find('fred.html', ['temp', 'dist']);
        assert.equal(rfile, 'fred.2323.html');

        rf = new RevvedFinder(function () {
          return ['dist/bar/../fred.2323.html'];
        });
        rfile = rf.find('../fred.html', ['temp/foo', 'dist/bar']);
        assert.equal(rfile, '../fred.2323.html');

        rf = new RevvedFinder(function () {
          return ['dist/bar/test.1234.png', 'dist/bar/images/test.1234.png'];
        });
        rfile = rf.find('images/test.png', ['temp/foo', 'dist/bar']);
        assert.equal(rfile, 'images/test.1234.png');

        rf = new RevvedFinder(function () {
          return ['dist/bar/../test.1234.png', 'dist/bar/../images/test.1234.png'];
        });
        rfile = rf.find('../images/test.png', ['temp/foo', 'dist/bar']);
        assert.equal(rfile, '../images/test.1234.png');

        rf = new RevvedFinder(function () {
          return ['dist/bar/images/test.1234.png', 'dist/bar/images/misc/test.1234.png'];
        });
        rfile = rf.find('images/misc/test.png', ['temp/foo', 'dist/bar']);
        assert.equal(rfile, 'images/misc/test.1234.png');
      });

      it('should return the path under which the file has been found');
    });

    describe('mapping', function () {
      describe('relative paths', function () {
        it('should return the corresponding file', function () {
          const rf = new RevvedFinder(helpers.normalize({
            'dist/images/misc/test.png': 'dist/images/misc/test.34546.png'
          }));
          const file = rf.find('images/misc/test.png', ['temp', 'dist']);
          assert.equal(file, 'images/misc/test.34546.png');
        });

        it('should handle correctly complicated relative paths', function () {
          const rf = new RevvedFinder(helpers.normalize({
            'images/misc/test.png': 'images/misc/test.34546.png'
          }));
          const file = rf.find('../../images/misc/test.png', ['temp/foo', 'dist/bar']);
          assert.equal(file, '../../images/misc/test.34546.png');
        });
      });
      describe('absolute paths', function () {
        it('should return the corresponding file', function () {
          const rf = new RevvedFinder(helpers.normalize({
            'dist/images/misc/test.png': 'dist/images/misc/test.34546.png'
          }));
          const file = rf.find('/images/misc/test.png', ['temp', 'dist']);
          assert.equal(file, '/images/misc/test.34546.png');
        });
      });
    });
  });
});
