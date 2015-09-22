/* jshint node:true */

'use strict';

var through     = require('through2'),
    mkdirp      = require('mkdirp'),
    gutil       = require('gulp-util'),
    path        = require('path'),
    fs          = require('fs'),
    async       = require('async'),
    PluginError = gutil.PluginError,
    File        = gutil.File,
    isWin       = process.platform === 'win32',
    debug;

var PLUGIN_NAME = 'gulp-symlink';

/**
 * Wrapper to log when debug === true
 * it's basically a console.log
 */
var log = function() {
  if(debug === true) {
    console.log.apply(console, [].slice.call(arguments));
    return console.log;
  } else {
    return function() { };
  }

};

/**
 * Error wrapper - this is called in the through context
 * @param  {Error}   error  The error
 * @return  {Function} cb    The through callback
 */
var errored = function(error, cb) {
  this.emit('error', new PluginError(PLUGIN_NAME, error));
  //Push the file so that the stream is piped to the next task even if it has errored
  //might be discussed
  this.push(this.source);
  return cb();
};

var symlinker = function(destination, resolver, options) {

  if(typeof resolver === 'object') {
    options = resolver;
    resolver = 'relative';
  }

  options = typeof options === 'object' ? options : {};
  options.force = options.force === undefined ? false : options.force;
  options.log = options.log === undefined ? true : options.log;

  //Handling array of destinations, this test is because "instance of" isn't safe
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
    if(symlink === undefined) {
      symlink = typeof destination === 'function' ? destination(source) : destination;
    }

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
      //resolve the absolute path from the source. It need to be from the current working directory to handle relative sources
      source.resolved =  path.resolve(source.cwd, source.path);
    }

    log('After resolving')(source.resolved + ' in ' + symlink.path);

    fs.exists(symlink.path, function(exists) {

      //No force option, we can't override!
      if(exists && !options.force) {
        return errored.call(self, 'Destination file exists ('+symlink.path+') - use force option to replace', callback);
      } else {

        async.waterfall([
          function(next){
            //remove destination if it exists already
            if(exists && options.force === true) {
              fs.unlink(symlink.path, function(err) {
                if(err) {
                  return errored.call(self, err, callback);
                }

                next();
              });
            } else {
              next();
            }
          },
          //checking if the parent directory exists
          function(next) {
            mkdirp(symlink.directory, function(err) {
              //ignoring directory err if it exists
              if(err && err.code !== 'EEXIST') {
                return errored.call(self, err, callback);
              }

              next();
            });
          }
        ], function () {
          //this is a windows check as specified in http://nodejs.org/api/fs.html#fs_fs_symlink_srcpath_dstpath_type_callback
          fs.stat(source.path, function(err, stat) {
            if(err) {
              return errored.call(self, err, callback);
            }

            source.stat = stat;

            fs.symlink(source.resolved, symlink.path, source.stat.isDirectory() ? 'dir' : 'file', function(err) {
              var success = function(){
                if (options.log) {
                  gutil.log(PLUGIN_NAME + ':' + gutil.colors.magenta(source.path), 'symlinked to', gutil.colors.magenta(symlink.path));
                }
                self.push(source);
                return callback();
              };

              if(err) {
                  if (!isWin || err.code !== 'EPERM') {
                    return errored.call(self, err, callback);
                  }

                  // Try with type "junction" on Windows
                  // Junctions behave equally to true symlinks and can be created in
                  // non elevated terminal (well, not always..)
                  fs.symlink(source.path, symlink.path, 'junction', function(err) {
                    if (err) {
                      return errored.call(self, err, callback);
                    }

                    return success();
                  });
              }

              return success();

            });

          });

        });

      }

    });

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
module.exports.File      = File;

module.exports._setDebug = function(value) {
  debug = value;
};
