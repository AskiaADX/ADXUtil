var common = require('../common/common.js');
var errMsg = common.messages.error;
var uuid   = require('node-uuid');
var InteractiveADXShell = require('../common/InteractiveADXShell.js').InteractiveADXShell;

/**
 * Manipulate an interview
 *
 * @class ADX.Interview
 */
function Interview(id, adxDirPath) {
    /**
     * Id of the interview
     * @type {String}
     */
    this.id     = id;

    /**
     * Path of the ADX directory
     * @type {String}
     */
    this.path   = adxDirPath;

    /**
     * Interactive shell that is used to manipulate the interview
     * @type {InteractiveADXShell}
     */
    this.shell  = new InteractiveADXShell(this.path, { mode : 'interview' });
}

/**
 * Create a new instance of interview
 *
 * @constructor
 * @param {String} id Id of the interview
 * @param {String} adxDirPath Path of the ADX directory
 */
Interview.prototype.constructor = Interview;

/**
 * Execute a command to manipulate an interview
 *
 * @param {String|"show"|"update"|"restart"} command Command to execute
 * @param {Object} [options] Options of the command
 * @param {String} [options.fixture] Name of the fixture file to use
 * @param {String} [options.output] Output of ADX to use
 * @param {String} [options.properties] Properties of the ADX
 * @param {String} [options.parameters] Parameters to update the interview
 * @param {String} [options.themes] Themes variables to set
 * @param {Function} [callback] Callback function
 */
Interview.prototype.execCommand = function execCommand(command, options, callback) {
    var args = [];

    args.push(command);

    // Swap arguments
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    if ('fixture' in options) {
        args.push('"-fixture:' + options.fixture + '"');
    }
    if ('output' in options) {
        args.push('"-output:' + options.output + '"');
    }
    if ('properties' in options) {
        args.push('"-properties:' + options.properties + '"');
    }
    if ('parameters' in options) {
        args.push('"-parameters:' + options.parameters + '"')
    }
    if ('themes' in options) {
        args.push('"-themes:' + options.themes + '"');
    }

    this.shell.exec(args, callback);
};

/**
 * Destroy the interview
 */
Interview.prototype.destroy = function destroy() {
    this.shell.destroy();
};

/**
 * Factory of the interviews
 *
 *      var ADX = require('adxutil').ADX;
 *
 *      var myAdx = new ADX('path/to/adx/');
 *      myAdx.load(function (err) {
 *          if (err) {
 *              throw err;
 *          }
 *
 *          // Get the instance of the interviews
 *          var inter = myAdx.interviews.create();
 *
 *          console.log(inter.id);
 *
 *      });
 *
 * @class ADX.InterviewsFactory
 */
function InterviewsFactory(adxDirPath) {
    if (!adxDirPath) {
        throw new Error(errMsg.invalidPathArg);
    }

    /**
     * Path of the ADX directory
     * @type {String}
     */
    this.path   = adxDirPath;

    /**
     * Interviews cache
     *
     * @type {Object}
     * @private
     */
    this._cache = {};
}

/**
 * Create a new instance of interviews factory
*
 * @constructor
 * @param {String} adxDirPath Path of the ADX directory
 */
InterviewsFactory.prototype.constructor = InterviewsFactory;

/**
 * Create a new instance of interview
 *
 * @return {ADX.Interview} Returns a new instance of interview
 */
InterviewsFactory.prototype.create = function createInterview() {
    var id = uuid.v4();
    while (this._cache[id]) {
        id = uuid.v4();
    }
    this._cache[id] = new Interview(id, this.path);
    return this._cache[id];
};

/**
 * Get the instance of interview using his id
 *
 * @param {String} id Id of the interview to retrieve
 * @return {undefined|ADX.Interview}
 */
InterviewsFactory.prototype.getById = function getById(id) {
    return this._cache[id];
};

/**
 * Remove the instance of interview using his id
 *
 * @param {String} id Id of the interview to remove
 */
InterviewsFactory.prototype.remove = function remove(id) {
    var interview = this._cache[id];
    if (!interview) {
        return;
    }
    interview.destroy();
    delete this._cache[id];
};

/**
 * Remove all instance of interviews
 */
InterviewsFactory.prototype.clear = function clear() {
    var id;
    for (id in this._cache) {
        if (this._cache.hasOwnProperty(id)) {
            this.remove(id);
        }
    }
};

// Make it public
exports.InterviewsFactory = InterviewsFactory;