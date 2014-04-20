# [gulp](https://github.com/wearefractal/gulp)-symlink [![Build Status](https://travis-ci.org/ben-eb/gulp-symlink.svg?branch=master)](https://travis-ci.org/ben-eb/gulp-symlink) [![NPM version](https://badge.fury.io/js/gulp-symlink.png)](http://badge.fury.io/js/gulp-symlink) [![Dependency Status](https://gemnasium.com/ben-eb/gulp-symlink.png)](https://gemnasium.com/ben-eb/gulp-symlink)

> Create symlinks during your gulp build.

**NOTE: Breaking changes are introduced in 1.0.0. gulp-symlink has been rewritten with a simpler API, that takes the output directory and renamed file as a single parameter. Existing gulpfiles using the old API will break if this module is substituted for the 0.4.x releases. Please take care to read the new API docs for migrating over from older versions. Thank you.**

## Installation

Install via [npm](https://npmjs.org/package/gulp-symlink):

```
npm install gulp-symlink --save-dev
```

## Example

```js
var gulp = require('gulp');
var symlink = require('gulp-symlink');

gulp.task('default', function() {
    gulp.src('assets/some-large-video.mp4')
        .pipe(symlink('build/videos')) // Write to the destination folder
        .pipe(symlink('build/videos/renamed-video.mp4')) // Write a renamed symlink to the destination folder
});
```

## API

### symlink(symlinkpath) or symlink.relative(symlinkpath)

Pass a `string` or a `function` to create the symlink. The function is passed the [vinyl](https://github.com/wearefractal/vinyl) object, so you can use `file.base`, `file.path` etc. Just make sure you return a string that is the location and or filename of the new symlink. For example:

```js
var path = require('path');
gulp.task('symlink', function() {
    gulp.src('assets/some-large-video.mp4')
        .pipe(symlink(function(file) {
            return path.join(file.base, 'build', file.relative.replace('some-large', ''));
        }));
```

The string options work in the same way. If you pass a string like 'build/videos', the symlink will be created in that directory. If you pass 'build/videos/video.mp4', the symlink will also be renamed.

### symlink.absolute(symlinkpath)

The exact same as `symlink.relative` except this will create an *absolute symlink* instead.
