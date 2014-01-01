# [gulp](https://github.com/wearefractal/gulp)-symlink

[![Build Status](https://travis-ci.org/ben-eb/gulp-symlink.png?branch=master)](https://travis-ci.org/ben-eb/gulp-symlink) [![NPM version](https://badge.fury.io/js/gulp-symlink.png)](http://badge.fury.io/js/gulp-symlink) [![Dependency Status](https://gemnasium.com/ben-eb/gulp-symlink.png)](https://gemnasium.com/ben-eb/gulp-symlink)

> Create symlinks during your gulp build.

## Installation

Install via [npm](https://npmjs.org/package/gulp-symlink):

```
npm install gulp-symlink --save-dev
```

## Example

```
var gulp = require('gulp');
var symlink = require('gulp-symlink');

gulp.task('default', function() {
    gulp.src('assets/some-large-video.mp4')
        .pipe(symlink('build/videos'))
});
```

## API

### symlink(destinationString)

Pass a string of where you would like the symlink(s) to go.
