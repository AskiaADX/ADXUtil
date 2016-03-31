"use strict";

/*
 1. Creates a documentation
 */


var gulp        = require('gulp'),
    del         = require('del'),
    shell       = require('gulp-shell');

// Destination files
var DEST_DOCS            = 'docs/';

// Source files
var SRC                 = 'app/';

// Default task
gulp.task('default', ['clean', 'document']);

// Global cleaning
gulp.task('clean', ['clean:docs']);

// Cleanup the documentation folder
gulp.task('clean:docs', function (cb) {
    del([DEST_DOCS + '**/*'], cb);
});

// Document
gulp.task('document', ['clean:docs'], function (cb) {
    var args = [
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
        SRC + 'ADXUtilAPI.js'
    ];

    var execFile = require('child_process').execFile;
    execFile('jsduck', args, {
        cwd   : process.cwd,
        env   : process.env
    }, function callback(err, stdout, stderr) {

        if (stderr) {
            console.warn(stderr);
        } else {
            console.log(stdout);
        }
        cb(err);
    });

    /*shell.task([
        'jsduck --title "ADXUtil" --output "' + DEST_DOCS + '" ' + files.join(' ')
    ]);*/
    // cb();
});

