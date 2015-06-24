# [gulp](https://github.com/gulpjs/gulp)-symlink [![Build Status](https://travis-ci.org/ben-eb/gulp-symlink.svg?branch=master)](https://travis-ci.org/ben-eb/gulp-symlink) [![Build status](https://ci.appveyor.com/api/projects/status/29i8g8c2s20utpqa/branch/master?svg=true)](https://ci.appveyor.com/project/ben-eb/gulp-symlink/branch/master) [![Dependency Status](https://gemnasium.com/ben-eb/gulp-symlink.svg)](https://gemnasium.com/ben-eb/gulp-symlink)

> Create symlinks during your gulp build.

## Install

With [npm](https://npmjs.org/package/gulp-symlink) do:

```
npm install gulp-symlink --save-dev
```

## Example

```js
var symlink = require('gulp-symlink');

gulp.task('default', function () {
  return gulp.src('assets/some-large-video.mp4')
    .pipe(symlink('build/videos')) // Write to the destination folder
    .pipe(symlink('build/videos/renamed-video.mp4')) // Write a renamed symlink to the destination folder
});
```

## API

### symlink(path, [options]), symlink.relative(path, [options]) or symlink.absolute(path, [options])

Pass a `string` or a `function` to create the symlink.
The function is passed the [vinyl](https://github.com/wearefractal/vinyl) object, so you can use `file.base`, `file.path` etc.
For example:

```js
gulp.task('symlink', function () {
  return gulp.src('assets/some-large-video.mp4')
    .pipe(symlink(function (file) {
      // Here we return a path as string
      return path.join(file.base, 'build', file.relative.replace('some-large', ''));
    }));
});

gulp.task('symlink-vinyl', function () {
  return gulp.src('assets/some-large-video.mp4')
    .pipe(symlink.absolute(function (file) {
        // Here we return a new Vinyl instance
        return new symlink.File({
          path: 'build/videos/video.mp4',
          cwd: process.cwd()
        });
    }, {force: true}));
})
```

The string options work in the same way. If you pass a string like 'build/videos', the symlink will be created in that directory. If you pass 'build/videos/video.mp4', the symlink will also be renamed.
The function will be called as many times as there are sources.

You might also want to give an array of destination paths:

```js
gulp.task('symlink-array', function () {
  return gulp.src(['modules/assets/', 'modules/client/'])
    .pipe(symlink(['./assets', './client']));
});
```

The default `symlink` performs a relative link. If you want an *absolute symlink* use `symlink.absolute` instead.

### symlink.File

The [vinyl module](https://github.com/wearefractal/vinyl) is exposed here. If you are creating new files with the function as shown above, please use this one.

## Contributing

Pull requests are welcome. If you add functionality, then please add unit tests
to cover it.

## License

MIT © [Ben Briggs](http://beneb.info)
