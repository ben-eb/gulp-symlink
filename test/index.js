/* jshint node: true */
/* global describe, it, beforeEach, before */

'use strict';

var expect  = require('chai').expect,
    rimraf  = require('rimraf'),
    gutil   = require('gulp-util'),
    symlink = require('../'),
    path    = require('path'),
    fs      = require('fs'),
    File    = gutil.File,
    testDir = path.join(__dirname, './fixtures');

symlink._setDebug(true);

/**
 * Expect that we created a symlink which contains the desired link text;
 * i.e. whether it is relative or absolute
 * @param  {string}   originalPath The original file's path
 * @param  {string}   symlinkPath  The symlink's path
 * @param  {Function} resolver     Method to check that the link between the files is accurate
 * @param  {Function} callback     Call this when we're done, if specified
 */
var assertion = function(originalPath, symlinkPath, resolver, callback) {
  fs.lstat(symlinkPath, function(err, stats) {
    if(err) {
      throw err;
    }

    expect(stats.isSymbolicLink()).to.be.true;

    fs.stat(originalPath, function(err, originalStat) {

      if(err) {
        throw err;
      }

      if(originalStat.isFile()) {
        expect(fs.readFileSync(originalPath).toString()).to.equal(fs.readFileSync(symlinkPath).toString());
      }

      fs.readlink(symlinkPath, function(err, link) {
        if(resolver === 'relative') {
          expect(link).to.equal(path[resolver].call(this, path.dirname(symlinkPath), originalPath));
        } else {
          expect(link).to.equal(path.resolve(path.dirname(symlinkPath), path.join(process.cwd(), originalPath.replace(process.cwd(), ''))));
        }
        callback && callback();
      });

    });
  });
};

describe('gulp-symlink', function() {
  function test(source, method, pathMethod) {

    var destination = path.join(testDir, 'links', path.basename(source));

    destination = path[pathMethod].call(null, process.cwd(), destination);

    beforeEach(function() {
      this.gutilFile = new File({
          path: source
      });
    });

    it('should emit an error if no destination was specified', function(cb) {
      var stream = method();

      stream.on('error', function(err) {
          expect(err instanceof gutil.PluginError).to.be.true;
          expect(err.toString()).to.contain.string('An output destination is required.');

          cb();
      });

      stream.write(this.gutilFile);
    });

    it('should create symlinks', function(cb) {
      var stream = method(destination);

      stream.on('data', function() {
          assertion(this.gutilFile.path, destination, pathMethod, cb);
      }.bind(this));

      stream.write(this.gutilFile);
    });

    it('should emit an error because it exists already', function(cb) {
      var stream = method(destination);

      stream.on('error', function(err) {
          expect(err instanceof gutil.PluginError).to.be.true;
          expect(err.toString()).to.contain.string('Destination file exists');

          cb();
      });

      stream.write(this.gutilFile);
    });

    it('should override symlinks', function(cb) {
      var stream = method(destination, {force: true});

      stream.on('data', function() {
          assertion(this.gutilFile.path, destination, pathMethod, cb);
      }.bind(this));

      stream.write(this.gutilFile);
    });

    it('should create symlinks renamed as a result of a function', function(cb) {
        var newName = 'renamed-link';
        var newTestPath = path.join(testDir, 'links', newName);

        var stream = method(function() {
            return newTestPath;
        });

        stream.on('data', function() {
            assertion(this.gutilFile.path, newTestPath, pathMethod, cb);
        }.bind(this));

        stream.write(this.gutilFile);
    });

    it('should create symlinks from functions that return vinyl objects', function(cb) {
      var file = new File({
          path: destination+'2'
      });

      var stream = method(function() {
          return file;
      });

      stream.on('data', function() {
          assertion(this.gutilFile.path, file.path, pathMethod, cb);
      }.bind(this));

      stream.write(this.gutilFile);
    });

    it('should create renamed symlinks', function(cb) {
      var newName = 'renamed-link-2';
      var newTestPath = path.join(testDir, 'links', newName);

      var stream = method(newTestPath);

      stream.on('data', function() {
          assertion(this.gutilFile.path, newTestPath, pathMethod, cb);
      }.bind(this));

      stream.write(this.gutilFile);
    });

    it('should create symlinks in nested directories', function(cb) {
      var subTestPath = path.join(testDir, 'links', 'subDir', path.basename(source));

      var stream = method(subTestPath);

      stream.on('data', function() {
          assertion(this.gutilFile.path, subTestPath, pathMethod, cb);
      }.bind(this));

      stream.write(this.gutilFile);
    });

    before(function(cb) {
      rimraf(path.join(testDir, 'links'), cb);
    });

  }

  describe('using relative paths & relative symlinks', function() {
    test('./test/fixtures/test', symlink.relative, 'relative');
  });

  describe('using full paths & relative symlinks', function() {
    test(path.join(__dirname, '/fixtures/test'), symlink.relative, 'relative');
  });

  describe('using relative paths & absolute symlinks', function() {
    test('./test/fixtures/test', symlink.absolute, 'resolve');
  });

  describe('using full paths & absolute symlinks', function() {
    test(path.join(__dirname, '/fixtures/test'), symlink.absolute, 'resolve');
  });

  describe('using a directory', function() {
    test('./test/fixtures/test_dir', symlink, 'relative');
  });

  describe('e2e tests', function() {

    it('should symlink through path', function(cb) {
      var src = new File({path: path.join(testDir, 'test')}), dest = './test/fixtures/links/test';

      var stream = symlink(dest, {force: true});

      stream.on('data', function() {
        assertion(src.path, dest, 'relative', cb);
      });

      stream.write(src);
    });

    it('should symlink 2 sources to 2 different destinations [array]', function(cb) {
      var srcs = [path.join(testDir, 'test'), path.join(testDir, 'test_dir')], dests = ['./test/fixtures/links/test', './test/fixtures/links/test_dir'];

      var stream = symlink(dests, {force: true});

      stream.on('data', function() { });

      stream.on('end', function() {
        for(var j in dests) {
          expect(fs.existsSync(dests[j])).to.be.true;
        }

        cb();
      });

      stream.write(new File({path: srcs[0]}));
      stream.write(new File({path: srcs[1]}));
      stream.end();
    });
  });

});
