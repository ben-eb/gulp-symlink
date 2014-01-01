/* jshint node: true */
/* jshint expr:true */
/* global describe, it, before, beforeEach, after, afterEach */

'use strict';

var expect = require('chai').expect,
    gutil  = require('gulp-util'),
    symlink = require('./index'),
    path = require('path'),
    fs = require('fs');

var testDir = 'test';
var testFile = 'index.js';
var testPath = testDir + path.sep + testFile;
var subDir = 'subdir';
var subTestPath = testDir + path.sep + subDir + path.sep + testFile;

describe('gulp-symlink', function() {
    it('should throw if no directory was specified', function(cb) {
        var stream = symlink();
        try {
            stream.write(new gutil.File({
                path: process.cwd() + path.sep + testFile
            }));
        } catch (e) {
            expect(e.toString()).to.contain.string('A destination folder is required.');
            cb();
        }
    });
    it('should create symlinks', function(cb) {
        var stream = symlink(testDir);

        stream.on('data', function(data) {
            expect(fs.existsSync(testPath)).to.be.true;
            expect(fs.lstatSync(testPath).isSymbolicLink()).to.be.true;
            cb();
        });

        stream.write(new gutil.File({
            path: process.cwd() + path.sep + testFile
        }));
    });
    it('should create symlinks in nested directories', function(cb) {
        var stream = symlink(testDir + path.sep + subDir);

        stream.on('data', function(data) {
            expect(fs.existsSync(subTestPath)).to.be.true;
            expect(fs.lstatSync(subTestPath).isSymbolicLink()).to.be.true;
            cb();
        });

        stream.write(new gutil.File({
            path: process.cwd() + path.sep + testFile
        }));
    });
    after(function() {
        fs.unlinkSync(subTestPath);
        fs.rmdirSync(testDir + path.sep + subDir);
        fs.unlinkSync(testPath);
        fs.rmdirSync(testDir);
    });
});
