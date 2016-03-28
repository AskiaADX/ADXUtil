var common          = require('../common/common.js');
var InteractiveADXShell = require('../common/InteractiveADXShell.js').InteractiveADXShell;
var pathHelper      = require('path');
var errMsg          = common.messages.error;


/**
 * Compile, execute and display the output of an ADC
 *
 * @class ADC.Show
 * @private
 */
function Show(adcDirPath) {
    /**
     * Root dir of the current ADCUtil
     */
    this.rootdir    = pathHelper.resolve(__dirname, "../../");

    /**
     * Path to the ADC directory
     * @type {string}
     */
    this.adcDirectoryPath = adcDirPath ? pathHelper.normalize(adcDirPath) : process.cwd();
}

/**
 * Create a new instance of ADC Show
 *
 * @constructor
 * @param {String} adcDirPath Path of the ADC directory
 */
Show.prototype.constructor = Show;

/**
 * Write an error output in the console
 * @param {String} text Text to write in the console
 */
Show.prototype.writeError = function writeError(text) {
    common.writeError.apply(common, arguments);
};

/**
 * Write a warning output in the console
 * @param {String} text Text to write in the console
 */
Show.prototype.writeWarning = function writeWarning(text) {
    common.writeWarning.apply(common, arguments);
};

/**
 * Write a success output in the console
 * @param {String} text Text to write in the console
 */
Show.prototype.writeSuccess = function writeSuccess(text) {
    common.writeSuccess.apply(common, arguments);
};

/**
 * Write an arbitrary message in the console without specific prefix
 * @param {String} text Text to write in the console
 */
Show.prototype.writeMessage = function writeMessage(text) {
    common.writeMessage.apply(common, arguments);
};

/**
 * Show an ADC output
 *
 * @param {Object} options Options
 * @param {String} options.output Name of the ADC Output to use
 * @param {String} options.fixture FileName of the ADC fixture to use
 * @param {String} [options.masterPage] Path of the master page to use
 * @param {String} [options.properties] ADC properties (in url query string format: 'param1=value1&param2-value2')
 * @param {InteractiveADXShell} [options.adxShell] Interactive ADXShell process
 * @param {Boolean} [options.silent=false] Silent mode: Don't message in the console but only through the callback
 * @param {Function} callback Callback function
 * @param {Error} callback.err Error
 * @param {String} callback.output Output string
 */
Show.prototype.show = function show(options, callback) {
    if (!options || !options.output) {
        if (!options.silent) {
            this.writeError(errMsg.noOutputDefinedForShow);
        }
        if (typeof callback === 'function') {
            callback(new Error(errMsg.noOutputDefinedForShow));
        }
        return;
    }

    if (!options || !options.fixture) {
        if (!options.silent) {
            this.writeError(errMsg.noFixtureDefinedForShow);
        }
        if (typeof callback === 'function') {
            callback(new Error(errMsg.noFixtureDefinedForShow));
        }
        return;
    }

    var execFile = require('child_process').execFile,
        args     = [
            'show',
            '"-output:' + options.output + '"',
            '"-fixture:' + options.fixture + '"'
        ];

    if (options.masterPage) {
        args.push('"-masterPage:' + pathHelper.resolve(options.masterPage) + '"');
    }
    if (options.properties) {
        args.push('"-properties:' + options.properties + '"');
    }
    args.push('"' + this.adcDirectoryPath + '"');

    var self = this;
    function execCallback(err, stdout, stderr) {
        if (err && typeof callback === 'function') {
            callback(err, null);
            return;
        }

        if (!options.silent) {
            self.writeMessage(stdout);
        }

        if (!stderr && typeof  callback === 'function') {
            callback(null, stdout);
        }

        if (stderr) {
            if (!options.silent) {
                self.writeError("\r\n" + stderr);
            }
            if (typeof callback === 'function') {
                callback(new Error(stderr));
            }
        }
    }

    if (!options.adxShell) {
        execFile('.\\' + common.ADX_UNIT_PROCESS_NAME, args, {
            cwd   : pathHelper.join(self.rootdir, common.ADX_UNIT_DIR_PATH),
            env   : process.env
        }, execCallback);
    } else {
        options.adxShell.exec(args.join(' '), execCallback);
    }

};

// Make it public
exports.Show = Show;

/*
 * Show an ADC output
 *
 * @param {Command} program Commander object which hold the arguments pass to the program
 * @param {String} path Path of the ADC to directory
 */
exports.show = function show(program, path) {
    var showInstance = new Show(path);
    showInstance.show(program);
};