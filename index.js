/* jshint node:true */

'use strict';

var through     = require('through2'),
    mkdirp      = require('mkdirp'),
    gutil       = require('gulp-util'),
    path        = require('path'),
    fs          = require('fs'),
    PluginError = gutil.PluginError,
    File        = gutil.File,
    debug;

var PLUGIN_NAME = 'gulp-symlink';

var log = function() {

  if(debug === true) {
    console.log.apply(console, [].slice.call(arguments));
    return console.log;
  } else {
    return function() { };
  }

};

var errored = function(error, cb) {
  this.emit('error', new PluginError(PLUGIN_NAME, error));
  //Push the file so that the stream is piped to the next task
  this.push(this.source);
  return cb();
};

var symlinker = function(destination, resolver, options) {

  if(typeof resolver === 'object') {
    options = resolver;
    resolver = 'absolute';
  }

  options = typeof options === 'object' ? options : {};
  options.force = options.force === undefined ? false : options.force;

  //pass the debug value to the through obj
//  debug = this.debug;

  if( Object.prototype.toString.call( destination ) === '[object Array]' ) {
    //copy array because we'll shift values
    var destinations = destination.slice();
  }

  return through.obj(function(source, encoding, callback) {

    var self = this, symlink;

    this.source = source; //error binding

    //else if we've got an array from before take the next element as a destination path
    symlink = destinations !== undefined ? destinations.shift() : symlink;

    //if destination is a function pass the source to it
    symlink = typeof destination === 'function' ? destination(source) : destination;

    //if symlink is still undefined there is a problem!
    if (symlink === undefined) {
      return errored.call(self, 'An output destination is required.', callback);
    }

    // Convert the destination path to a new vinyl instance
    symlink = symlink instanceof File ? symlink : new File({ path: symlink });


    log('Before resolving')('Source: %s – dest: %s', source.path, symlink.path);

    symlink.directory = path.dirname(symlink.path); //this is the parent directory of the symlink

    // Resolve the path to the symlink
    if(resolver === 'relative' || options.relative === true) {
      source.resolved = path.relative(symlink.directory, source.path);
    } else {
      //resolve from the symlink directory the absolute path from the source. It need to be from the current working directory to handle relative sources
      source.resolved = path.resolve(symlink.directory, path.join(source.cwd, source.path.replace(source.cwd, '')));
      //maybe this could be done better like  p.resolve(source.cwd, source.path) ?
    }

    log('After resolving')(source.resolved + ' in ' + symlink.path);

    var exists = fs.existsSync(symlink.path);

    //No force option, we can't override!
    if(exists && !options.force) {
      return errored.call(self, 'Destination file exists ('+destination+') - use force option to replace', callback);
    } else {

      //remove destination if it exists already
      if(exists && options.force === true) {
        fs.unlinkSync(symlink.path);
      }

      //this is a windows check as specified in http://nodejs.org/api/fs.html#fs_fs_symlink_srcpath_dstpath_type_callback
      fs.stat(source.path, function(err, stat) {

        if(err) {
          return errored.call(self, err, callback);
        }

        source.stat = stat;

        if(!fs.existsSync(symlink.directory)) {
          mkdirp.sync(symlink.directory);
        }

        fs.symlink(source.resolved, symlink.path, source.stat.isDirectory() ? 'dir' : 'file', function(err) {

          if(err) {
            return errored.call(self, err, callback);
          } else {
            gutil.log(PLUGIN_NAME + ':' + gutil.colors.magenta(source.path), 'symlinked to', gutil.colors.magenta(symlink.path));
            self.push(source);
            return callback();
          }
        });

      });
    }

  });
};

var relativesymlinker = function(symlink, options) {
  return symlinker(symlink, 'relative', options);
};

var absolutesymlinker = function(symlink, options) {
  return symlinker(symlink, 'absolute', options);
};

// Expose main functionality under relative, for convenience
module.exports           = relativesymlinker;
module.exports.relative  = relativesymlinker;
module.exports.absolute  = absolutesymlinker;

module.exports._setDebug = function(value) {
  debug = value;
};
