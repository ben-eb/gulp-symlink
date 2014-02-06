/* jshint node:true */

'use strict';

var map = require('map-stream'),
    path = require('path'),
    gutil = require('gulp-util'),
    mkdirp = require('mkdirp'),
    fs = require('fs');

function relative(filepath) {
    return gutil.colors.blue(filepath);
}

module.exports = function(out) {
    return map(function(file, cb) {
        if (typeof out === 'undefined') {
            cb(new gutil.PluginError('gulp-symlink', 'A destination folder is required.'));
        }

        var dest = path.resolve(process.cwd(), out);
        var sym = path.join(path.resolve(file.base, dest), path.basename(file.path));

        gutil.log('symlink', relative(sym), '->', relative(file.path));

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
                        return cb(err, file);
                    }
                    fs.symlink(file.path, sym, finish);
                });
            }

            finish(err);
        });
    });
};
