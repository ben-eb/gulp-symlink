/* jshint node: true */
/* jshint expr:true */
/* global describe, it, after */

'use strict';

var expect = require('chai').expect,
    gutil  = require('gulp-util'),
    symlink = require('./index'),
    path = require('path'),
    fs = require('fs');

// silence the log, maybe there's a better way?
gutil.log = function() {};

describe('gulp-symlink', function() {
    function test(testDir) {
        var testFile = 'index.js';
        var testPath = path.join(testDir, testFile);

        var newName = 'renamed-link.js';
        var newTestPath = path.join(testDir, newName);

        var newName2 = 'renamed-link-2.js';
        var newTestPath2 = path.join(testDir, newName2);

        var subDir = 'subdir';
        var subTestPath = path.join(testDir, subDir, testFile);

        it('should throw if no directory was specified', function(cb) {
            var stream = symlink();
            try {
                stream.write(new gutil.File({
                    path: path.join(process.cwd(), testFile)
                }));
            } catch (e) {
                expect(e.toString()).to.contain.string('A destination folder is required.');
                cb();
            }
        });
        it('should create symlinks', function(cb) {
            var stream = symlink(testDir);

            stream.on('data', function() {
                expect(fs.existsSync(testPath)).to.be.true;
                expect(fs.lstatSync(testPath).isSymbolicLink()).to.be.true;
                cb();
            });

            stream.write(new gutil.File({
                path: path.join(process.cwd(), testFile)
            }));
        });
        it('should create symlinks renamed as specified', function(cb) {
            var stream = symlink(testDir, function (name) {
                return newName;
            });

            stream.on('data', function() {
                expect(fs.existsSync(newTestPath)).to.be.true;
                expect(fs.lstatSync(newTestPath).isSymbolicLink()).to.be.true;
                cb();
            });

            stream.write(new gutil.File({
                path: path.join(process.cwd(), testFile)
            }));
        });
        it('should create symlinks with the specified name', function(cb) {
            var stream = symlink(testDir, newName2);

            stream.on('data', function() {
                expect(fs.existsSync(newTestPath)).to.be.true;
                expect(fs.lstatSync(newTestPath).isSymbolicLink()).to.be.true;
                cb();
            });

            stream.write(new gutil.File({
                path: path.join(process.cwd(), testFile)
            }));
        });
        it('should create symlinks in nested directories', function(cb) {
            var stream = symlink(path.join(testDir, subDir));

            stream.on('data', function() {
                expect(fs.existsSync(subTestPath)).to.be.true;
                expect(fs.lstatSync(subTestPath).isSymbolicLink()).to.be.true;
                cb();
            });

            stream.write(new gutil.File({
                path: path.join(process.cwd(), testFile)
            }));
        });
        after(function() {
            fs.unlinkSync(subTestPath);
            fs.rmdirSync(path.join(testDir, subDir));
            fs.unlinkSync(testPath);
            fs.unlinkSync(newTestPath);
            fs.unlinkSync(newTestPath2);
            fs.rmdirSync(testDir);
        });
    }

    describe('using relative path', function() {
        test('test');
    });

    describe('using full path', function() {
        test(__dirname + '/test');
    });
});
