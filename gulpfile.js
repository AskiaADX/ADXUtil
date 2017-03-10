"use strict";

/*
 1. Creates a documentation
 */


const gulp      = require('gulp');
const del       = require('del');
const shell     = require('gulp-shell');

// Destination files
const DEST_DOCS   = 'docs/';

// Source files
const SRC         = 'app/';

// Default task
gulp.task('default', ['clean', 'document']);

// Global cleaning
gulp.task('clean', ['clean:docs']);

// Cleanup the documentation folder
gulp.task('clean:docs',  (cb) => {
    del([DEST_DOCS + '**/*'], cb);
});

// Document
const jsdoc = require('gulp-jsdoc3');

gulp.task('document', ['clean:docs'], (cb) => {
    gulp.src(['readme.md', './app/**/*.js'], {read: false})
        .pipe(jsdoc(cb));
});
/*gulp.task('document', ['clean:docs'], (cb) => {
    const args = [
        '--title=ADXUtil',
        '--output=' + DEST_DOCS,
        SRC + 'common/common.js',
        SRC + 'common/InteractiveADXShell.js',
        SRC + 'preferences/ADXPreferences.js',
        SRC + 'builder/ADXBuilder.js',
        SRC + 'configurator/ADXConfigurator.js',
        SRC + 'generator/ADXGenerator.js',
        SRC + 'show/ADXShow.js',
        SRC + 'validator/ADXValidator.js',
        SRC + 'interviews/ADXInterviews.js',
        SRC + 'ADXUtilAPI.js'
    ];

    const execFile = require('child_process').execFile;
    execFile('jsduck', args, {
        cwd   : process.cwd,
        env   : process.env
    }, (err, stdout, stderr) => {

        if (stderr) {
            console.warn(stderr);
        } else {
            console.log(stdout);
        }
        cb(err);
    });
*/
    /*shell.task([
        'jsduck --title "ADXUtil" --output "' + DEST_DOCS + '" ' + files.join(' ')
    ]);*/
    // cb();
// });

