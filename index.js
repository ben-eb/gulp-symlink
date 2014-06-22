/* jshint node:true */

'use strict';

var through     = require('through2'),
    mkdirp      = require('mkdirp'),
    gutil       = require('gulp-util'),
    path        = require('path'),
    fs          = require('fs'),

    PLUGIN_NAME = 'gulp-symlink';

function localPath(absolutePath) {
    var cwd = process.cwd();
    return absolutePath.indexOf(cwd) === 0 ? absolutePath.substr(cwd.length + 1) : absolutePath;
}

var symlinker = function(destination, resolver) {
    return through.obj(function(file, encoding, cb) {
        var self = this, symlink;

        if (typeof destination === 'undefined') {
            this.emit('error', new gutil.PluginError(PLUGIN_NAME, 'An output destination is required.'));
            return cb();
        }

        // Resolve the path to the original file
        file.path = resolver.call(this, file.cwd, file.path);

        // Is the destination path a string or function?
        symlink = typeof destination === 'string' ? destination : destination(file);

        // Convert the destination path to a new vinyl instance
        symlink = symlink instanceof gutil.File ? symlink : new gutil.File({ path: symlink });

        // Resolve the path to the symlink
        symlink.path = resolver.call(this, symlink.cwd, symlink.path);

        // Add the file path onto the symlink path if it is a directory
        if (path.extname(symlink.path) === '') {
            symlink.path = path.join(symlink.path, path.basename(file.path));
        }

        // Create the output folder for the symlink
        mkdirp(path.dirname(symlink.path), function(err) {
            if (err) {
                self.emit('error', new gutil.PluginError(PLUGIN_NAME, err));
                return cb();
            }
            // Check whether the source file is a directory or not
            fs.stat(file.path, function(err, stat) {
                // Create the symlink
                fs.symlink(file.path, symlink.path, stat.isDirectory() ? 'dir' : 'file', function(err) {
                    if (err) {
                        self.emit('error', new gutil.PluginError(PLUGIN_NAME, err));
                        return cb();
                    }
                    if (symlinker.prototype.debug === false) {
                        gutil.log(gutil.colors.magenta(localPath(file.path)), 'symlinked to', gutil.colors.magenta(localPath(symlink.path)));
                    }
                    self.push(file);
                    cb();
                });
            });
        });
    });
};

var relativesymlinker = function(symlink) {
    return symlinker(symlink, path.relative);
};

var absolutesymlinker = function(symlink) {
    return symlinker(symlink, path.resolve);
};

var _setDebug = function(value) {
    symlinker.prototype.debug = value;
};

_setDebug(false);

// Expose main functionality under relative, for convenience

module.exports           = relativesymlinker;
module.exports.relative  = relativesymlinker;
module.exports.absolute  = absolutesymlinker;
module.exports._setDebug = _setDebug;
