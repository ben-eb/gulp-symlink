/* jshint node:true */

'use strict';

var map = require('map-stream'),
    path = require('path'),
    gutil = require('gulp-util'),
    mkdirp = require('mkdirp'),
    fs = require('fs');

function localPath(absolutePath) {
    var cwd = process.cwd();
    return absolutePath.indexOf(cwd) === 0 ? absolutePath.substr(cwd.length + 1) : absolutePath;
}

module.exports = function(out, rename) {
    return map(function(file, cb) {
        if (typeof out === 'undefined') {
            cb(new gutil.PluginError('gulp-symlink', 'A destination folder is required.'));
        }

        var sourceName = path.basename(file.path);
        var targetName = null;

        if (typeof rename === 'function') {
            targetName = rename(sourceName);
        }

        var dest = path.resolve(process.cwd(), out);
        var sym = path.join(path.resolve(file.base, dest), targetName || sourceName);

        gutil.log('Symlink', gutil.colors.magenta(localPath(sym)), '->', gutil.colors.magenta(localPath(file.path)));

        function finish(err) {
            if (err && err.code !== 'EEXIST') {
                return cb(new gutil.PluginError('gulp-symlink', err));
            }
            cb(null, file);
        }

        fs.symlink(file.path, sym, function(err) {
            // Most likely there's no directory there...
            if (err && err.code === 'ENOENT') {
                // Recursively make directories in case we want a nested symlink
                return mkdirp(dest, function(err) {
                    if (err) {
                        return cb(new gutil.PluginError('gulp-symlink', err), file);
                    }
                    fs.symlink(file.path, sym, finish);
                });
            }

            finish(err);
        });
    });
};
