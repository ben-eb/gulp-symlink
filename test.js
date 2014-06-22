/* jshint node: true */
/* jshint expr:true */
/* global describe, it, afterEach, beforeEach */

'use strict';

var expect  = require('chai').expect,
    rimraf  = require('rimraf'),
    gutil   = require('gulp-util'),
    symlink = require('./'),
    path    = require('path'),
    fs      = require('fs');

symlink._setDebug(true);

/**
 * Expect that we created a symlink which contains the desired link text;
 * i.e. whether it is relative or absolute
 * @param  {String}   fpath      Path to the symlink
 * @param  {Function}   pathMethod A method passed in to compare the cwd to the linked path
 * @param  {Function} callback   Call the callback when we're done
 */
var assertion = function(fpath, pathMethod, callback) {
    fs.lstat(fpath, function(err, stats) {
        expect(stats.isSymbolicLink()).to.be.true;
        fs.readlink(fpath, function(err, link) {
            expect(link).to.equal(pathMethod(process.cwd(), link));
            callback && callback();
        });
    });
};

describe('gulp-symlink', function() {
    function test(testDir, method, pathMethod) {
        var testFile = 'index.js';
        var testPath = path.join(testDir, testFile);

        beforeEach(function() {
            this.gutilFile = new gutil.File({
                path: path.join(process.cwd(), testFile)
            });
        });

        it('should emit an error if no directory was specified', function() {
            var stream = method();

            stream.on('error', function(err) {
                expect(err instanceof gutil.PluginError).to.be.true;
                expect(err.toString()).to.contain.string('An output destination is required.');
            });

            stream.write(this.gutilFile);
        });
        it('should create symlinks', function(cb) {
            var stream = method(testDir);

            stream.on('data', function() {
                assertion(testPath, pathMethod, cb);
            });

            stream.write(this.gutilFile);
        });
        it('should create symlinks renamed as a result of a function', function(cb) {
            var newName = 'renamed-link.js';
            var newTestPath = path.join(testDir, newName);

            var stream = method(function() {
                return newTestPath;
            });

            stream.on('data', function() {
                assertion(newTestPath, pathMethod, cb);
            });

            stream.write(this.gutilFile);
        });
        it('should create renamed symlinks', function(cb) {
            var newName2 = 'renamed-link-2.js';
            var newTestPath2 = path.join(testDir, newName2);

            var stream = method(testDir + path.sep + newName2);

            stream.on('data', function() {
                assertion(newTestPath2, pathMethod, cb);
            });

            stream.write(this.gutilFile);
        });
        it('should create symlinks in nested directories', function(cb) {
            var subDir = 'subdir';
            var subTestPath = path.join(testDir, subDir, testFile);

            var stream = method(path.join(testDir, subDir));

            stream.on('data', function() {
                assertion(subTestPath, pathMethod, cb);
            });

            stream.write(this.gutilFile);
        });
        it('should symlink multiple input files in the same stream', function(cb) {
            var stream = method(function(file) {
                return path.join(testDir, file.relative);
            });

            var fileOne = new gutil.File({
                path: path.join(process.cwd(), 'test.js')
            });

            var fileTwo = new gutil.File({
                path: path.join(process.cwd(), 'README.md')
            });

            stream.on('data', function(sym) {
                if (sym === fileOne) {
                    assertion(path.join(testDir, 'test.js'), pathMethod);
                } else {
                    assertion(path.join(testDir, 'README.md'), pathMethod);
                }
            });

            stream.on('end', cb);

            stream.write(fileOne);
            stream.write(fileTwo);
            stream.end();
        });
        afterEach(function(cb) {
            rimraf(testDir, cb);
        });
    }

    describe('using relative paths & relative symlinks', function() {
        test('test', symlink.relative, path.relative);
    });

    describe('using full paths & relative symlinks', function() {
        test(__dirname + '/test', symlink.relative, path.relative);
    });

    describe('using relative paths & absolute symlinks', function() {
        test('test', symlink.absolute, path.resolve);
    });

    describe('using full paths & absolute symlinks', function() {
        test(__dirname + '/test', symlink.absolute, path.resolve);
    });
});
