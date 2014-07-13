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

var symlinker = function(options, destination, resolver) {
    return through.obj(function(file, encoding, cb) {
        var self = this, symlink;

        if (typeof options !== 'object') {
            destination = options;
        }

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

        // Variable to contain the diff between the original path and the new symlink
        var out = resolver.call(this, path.dirname(symlink.path), file.path);

        var finish = function() {
            // Check whether the source file is a directory or not
            fs.stat(file.path, function(err, stat) {
                var create = function() {
                    // Create the symlink
                    fs.symlink(out, symlink.path, stat.isDirectory() ? 'dir' : 'file', function(err) {
                        if (err && err.code !== 'EEXIST') {
                            self.emit('error', new gutil.PluginError(PLUGIN_NAME, err));
                            return cb();
                        }
                        if (symlinker.prototype.debug === false) {
                            gutil.log(gutil.colors.magenta(localPath(file.path)), 'symlinked to', gutil.colors.magenta(localPath(symlink.path)));
                        }
                        self.push(file);
                        cb();
                    });
                };
                // Do we override the symlink that is already there?
                fs.exists(symlink.path, function(exists) {
                    if (exists && options.overwrite) {
                        fs.unlink(symlink.path, function() {
                            create();
                        });
                    } else {
                        create();
                    }
                });
            });
        };

        fs.exists(path.dirname(symlink.path), function(exists) {
            if (! exists) {
                // If it doesn't exist, create the output folder for the symlink
                mkdirp(path.dirname(symlink.path), function(err) {
                    if (err) {
                        self.emit('error', new gutil.PluginError(PLUGIN_NAME, err));
                        return cb();
                    }
                    finish();
                });
            } else {
                finish();
            }
        });
    });
};

var relativesymlinker = function(options, symlink) {
    return symlinker(options, symlink, path.relative);
};

var absolutesymlinker = function(options, symlink) {
    return symlinker(options, symlink, path.resolve);
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
