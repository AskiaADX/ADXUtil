var fs      = require('fs');
var path    = require('path');
var common  = require('../common/common.js');
var msg     = common.messages.message;
/**
 * Manage the user preferences
 *
 * @class ADC.Preferences
 * @singleton
 */
function Preferences(){}


/**
 * Create a new instance of ADC Preferences
 *
 * @constructor
 */
Preferences.prototype.constructor = Preferences;

/**
 * Write an error output in the console
 * @param {String} text Text to write in the console
 */
Preferences.prototype.writeError = function writeError(text) {
    common.writeError.apply(common, arguments);
};

/**
 * Write a warning output in the console
 * @param {String} text Text to write in the console
 */
Preferences.prototype.writeWarning = function writeWarning(text) {
    common.writeWarning.apply(common, arguments);
};

/**
 * Write a success output in the console
 * @param {String} text Text to write in the console
 */
Preferences.prototype.writeSuccess = function writeSuccess(text) {
    common.writeSuccess.apply(common, arguments);
};

/**
 * Write an arbitrary message in the console without specific prefix
 * @param {String} text Text to write in the console
 */
Preferences.prototype.writeMessage = function writeMessage(text) {
    common.writeMessage.apply(common, arguments);
};

/**
 * Read the preferences
 *
 * @param {Object} [options]
 * @param {Boolean} [options.silent=false] By pass the output
 * @param {Function} [callback] Callback
 * @param {Object|null} [callback.preferences]
 * @param {Object} [callback.preferences.author] Default ADC author
 * @param {String} [callback.preferences.author.name] Default Name of the ADC author
 * @param {String} [callback.preferences.author.email] Default Email of the ADC author
 * @param {String} [callback.preferences.author.company] Default Company of the ADC author
 * @param {String} [callback.preferences.author.webSite] Default WebSite of the ADC author
 */
Preferences.prototype.read = function read(options, callback) {
    // Swap arguments
    if (typeof options === 'function') {
        callback = options;
        options = null;
    }

    var filePath = path.join(process.env.APPDATA, common.APP_NAME, common.PREFERENCES_FILE_NAME);
    var self = this;
    fs.readFile(filePath, function onReadPreferencesFile(err, data) {
        if (err || !data) {
            if (!options || !options.silent) {
                self.writeMessage(msg.noPreferences);
            }
            if (typeof callback === 'function') {
                callback(null);
            }
            return;
        }
        var json = JSON.parse(data.toString());
        if (!options || !options.silent) {
            self.writeMessage(JSON.stringify(json, null, 2));
        }
        if (typeof callback === 'function') {
            callback(json);
        }
    });
};


/**
 * Write the preferences
 *
 * @param {Object} preferences
 * @param {Object} [preferences.author] Default ADC author
 * @param {String} [preferences.author.name] Default Name of the ADC author
 * @param {String} [preferences.author.email] Default Email of the ADC author
 * @param {String} [preferences.author.company] Default Company of the ADC author
 * @param {String} [preferences.author.webSite] Default WebSite of the ADC author
 * @param {Function} [callback] Callback
 * @param {Object|null} [callback.preferences]
 * @param {Object} [callback.preferences.author] Default ADC author
 * @param {String} [callback.preferences.author.name] Default Name of the ADC author
 * @param {String} [callback.preferences.author.email] Default Email of the ADC author
 * @param {String} [callback.preferences.author.company] Default Company of the ADC author
 * @param {String} [callback.preferences.author.website] Default Website of the ADC author
 */
Preferences.prototype.write = function write(preferences, callback) {
    if (!preferences || !preferences.author) {
        if (typeof callback === 'function') {
            this.read(callback);
        }
        return;
    }

    var self = this;
    this.read({silent : true}, function (currentPrefs) {
        currentPrefs = currentPrefs || {};
        currentPrefs.author = currentPrefs.author || {};
        if ("name" in preferences.author) {
            currentPrefs.author.name  = preferences.author.name;
        }
        if ("email" in preferences.author) {
            currentPrefs.author.email  = preferences.author.email;
        }
        if ("company" in preferences.author) {
            currentPrefs.author.company  = preferences.author.company;
        }
        if ("website" in preferences.author) {
            currentPrefs.author.website  = preferences.author.website;
        }

        var filePath = path.join(process.env.APPDATA, common.APP_NAME, common.PREFERENCES_FILE_NAME);
        // Make sure the directory exist
        fs.mkdir(path.join(filePath, '../'), function () {
            fs.writeFile(filePath, JSON.stringify(currentPrefs), {encoding : 'utf8'}, function () {
                self.read(callback);
            });
        })
    });
};

/**
 * Singleton instance of the preferences
 */
Preferences.getInstance = function getInstance() {
    if (!Preferences._instance) {
        Preferences._instance = new Preferences();
    }
    return Preferences._instance;
};

/**
 * Single instance of the preferences object
 * @type {ADC.Preferences}
 */
exports.preferences = Preferences.getInstance();

/**
 * Read the user preferences and display it
 *
 * @param {Object} [options]
 * @param {Boolean} [options.silent=false] By pass the output
 * @param {Function} [callback] Callback
 * @param {Object|null} [callback.preferences]
 * @param {Object} [callback.preferences.author] Default ADC author
 * @param {String} [callback.preferences.author.name] Default Name of the ADC author
 * @param {String} [callback.preferences.author.email] Default Email of the ADC author
 * @param {String} [callback.preferences.author.company] Default Company of the ADC author
 * @param {String} [callback.preferences.author.website] Default Website of the ADC author
 */
exports.read = function read(options, callback) {
    exports.preferences.read(options, callback);
};


/**
 * Write the preferences
 *
 * @param {Object} preferences
 * @param {Object} [preferences.author] Default ADC author
 * @param {String} [preferences.author.name] Default Name of the ADC author
 * @param {String} [preferences.author.email] Default Email of the ADC author
 * @param {String} [preferences.author.company] Default Company of the ADC author
 * @param {String} [preferences.author.webSite] Default WebSite of the ADC author
 * @param {Function} [callback] Callback
 * @param {Object|null} [callback.preferences]
 * @param {Object} [callback.preferences.author] Default ADC author
 * @param {String} [callback.preferences.author.name] Default Name of the ADC author
 * @param {String} [callback.preferences.author.email] Default Email of the ADC author
 * @param {String} [callback.preferences.author.company] Default Company of the ADC author
 * @param {String} [callback.preferences.author.webSite] Default WebSite of the ADC author
 */
exports.write = function write(preferences, callback) {
    exports.preferences.write(preferences, callback);
};

