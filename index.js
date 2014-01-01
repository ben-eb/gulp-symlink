/* jshint node:true */

'use strict';

var map  = require('map-stream'),
    path = require('path'),
    mkdirp = require('mkdirp').sync,
    fs   = require('fs');

module.exports = function() {
    var out = arguments[0];
    return map(function(file, cb) {
        var dest = process.cwd() + path.sep + out;
        var sym = path.resolve(file.path, dest) + path.sep + path.basename(file.path);
        try {
            fs.symlinkSync(file.path, sym);
            // That was easy!
            cb(null, file);
        }
        catch(e) {
            // Most likely there's no directory there...
            if (e.code === 'ENOENT') {
                // Recursively make directories in case we want a nested symlink
                mkdirp(dest);
                // Retry...
                try {
                    fs.symlinkSync(file.path, sym);
                }
                catch (e) {
                    if (e.code !== 'EEXIST') {
                        cb(new Error('gulp-symlink: ' + e));
                    }
                }
                // Close one... but all is well
                cb(null, file);
            } else if (e.code !== 'EEXIST') {
                // Fail if we caught another error (other than the symlink already exists)
                cb(new Error('gulp-symlink: ' + e));
            }
        }
    });
};
