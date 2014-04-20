/* jshint node: true */
/* jshint expr:true */
/* global describe, it, after */

'use strict';

var expect  = require('chai').expect,
    rimraf  = require('rimraf'),
    gutil   = require('gulp-util'),
    symlink = require('./'),
    path    = require('path'),
    fs      = require('fs');

symlink._setDebug(true);

var assertion = function(path, callback) {
    expect(fs.existsSync(path)).to.be.true;
    expect(fs.lstatSync(path).isSymbolicLink()).to.be.true;
    callback();
};

describe('gulp-symlink', function() {
    function test(testDir, method) {
        var testFile = 'index.js';
        var testPath = path.join(testDir, testFile);

        it('should throw if no directory was specified', function(cb) {
            var stream = method();
            try {
                stream.write(new gutil.File({
                    path: path.join(process.cwd(), testFile)
                }));
            } catch (e) {
                expect(e.toString()).to.contain.string('An output destination is required.');
                cb();
            }
        });
        it('should create symlinks', function(cb) {
            var stream = method(testDir);

            stream.on('data', function() {
                assertion(testPath, cb);
            });

            stream.write(new gutil.File({
                path: path.join(process.cwd(), testFile)
            }));
        });
        it('should create symlinks renamed as a result of a function', function(cb) {
            var newName = 'renamed-link.js';
            var newTestPath = path.join(testDir, newName);

            var stream = method(function() {
                return newTestPath;
            });

            stream.on('data', function() {
                assertion(newTestPath, cb);
            });

            stream.write(new gutil.File({
                path: path.join(process.cwd(), testFile)
            }));
        });
        it('should create renamed symlinks', function(cb) {
            var newName2 = 'renamed-link-2.js';
            var newTestPath2 = path.join(testDir, newName2);

            var stream = method(testDir + path.sep + newName2);

            stream.on('data', function() {
                assertion(newTestPath2, cb);
            });

            stream.write(new gutil.File({
                path: path.join(process.cwd(), testFile)
            }));
        });
        it('should create symlinks in nested directories', function(cb) {
            var subDir = 'subdir';
            var subTestPath = path.join(testDir, subDir, testFile);

            var stream = method(path.join(testDir, subDir));

            stream.on('data', function() {
                assertion(subTestPath, cb);
            });

            stream.write(new gutil.File({
                path: path.join(process.cwd(), testFile)
            }));
        });
        after(function(cb) {
            rimraf(testDir, cb);
        });
    }

    describe('using relative paths & relative symlinks', function() {
        test('test', symlink.relative);
    });

    describe('using full paths & relative symlinks', function() {
        test(__dirname + '/test', symlink.relative);
    });

    describe('using relative paths & absolute symlinks', function() {
        test('test', symlink.absolute);
    });

    describe('using full paths & absolute symlinks', function() {
        test(__dirname + '/test', symlink.absolute);
    });
});
