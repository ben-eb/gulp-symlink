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

var symlinker = function(symlink, resolver) {
    return through.obj(function(file, encoding, cb) {
        var self = this,
            sym  = null;

        if (typeof symlink === 'undefined') {
            this.emit('error', new gutil.PluginError(PLUGIN_NAME, 'An output destination is required.'));
            return cb();
        } else if (typeof symlink === 'function') {
            symlink = symlink(file);
        }

        var destination = resolver.call(this, process.cwd(), symlink);

        // Check whether the destination is a directory
        if (path.extname(symlink) === '') {
            sym = path.join(destination, path.basename(file.path));
        } else {
            sym = destination;
            destination = destination.replace(path.basename(destination), '');
        }

        var source = resolver.call(this, destination, file.path);

        var finish = function(err) {
            if (err && err.code !== 'EEXIST') {
                self.emit('error', new gutil.PluginError(PLUGIN_NAME, err));
                return cb();
            }
            self.push(file);
            if (symlinker.prototype.debug === false) {
                gutil.log(gutil.colors.magenta(localPath(file.path)), 'symlinked to', gutil.colors.magenta(localPath(sym)));
            }
            cb();
        };

        fs.symlink(source, sym, function(err) {
            // Most likely there's no directory there...
            if (err && err.code === 'ENOENT') {
                // Recursively make directories in case we want a nested symlink
                return mkdirp(destination, function(err) {
                    if (err) {
                        self.emit('error', new gutil.PluginError(PLUGIN_NAME, err), file);
                        return cb();
                    }
                    fs.symlink(source, sym, finish);
                });
            }
            finish(err);
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
