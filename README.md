# [gulp](https://github.com/wearefractal/gulp)-symlink [![Build Status](https://travis-ci.org/ben-eb/gulp-symlink.svg?branch=master)](https://travis-ci.org/ben-eb/gulp-symlink) [![NPM version](https://badge.fury.io/js/gulp-symlink.png)](http://badge.fury.io/js/gulp-symlink) [![Dependency Status](https://gemnasium.com/ben-eb/gulp-symlink.png)](https://gemnasium.com/ben-eb/gulp-symlink)

> Create symlinks during your gulp build.

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
        .pipe(symlink('build/videos'))
});
```

## API

### `symlink(destinationString)`

Pass a string of where you would like the symlink(s) to go.

### `symlink(targetDir, rename)`

Symlinks each file in the stream into `targetDir` renaming it according to
`rename`. If `rename` is a string, the resulting file will be given its value
as name. Otherwise, if `rename`is a function, it should take the source
filename as its single parameter and should return the desired target
filename.
