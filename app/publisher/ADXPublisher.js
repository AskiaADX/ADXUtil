var common          = require('../common/common.js');
var errMsg          = common.messages.error;
var Configurator	= require('../configurator/ADXConfigurator.js').Configurator;
var preferences     = require('../preferences/ADXPreferences.js');

exports.platforms = {
    'ZenDesk'   :   require('./ADXPublisherZenDesk.js')
};

/**
 * Create a new instance of a publisher
 * @param {Configurator} configurator
 */
function Publisher(configurator) {

    if (!(configurator instanceof Configurator)) {
        throw errMsg.invalidConfiguratorArg;
    }
    this.configurator = configurator;
}

/**
 * Publish to publisher
 * @param {String} platform Name of the platform to push
 * @param {Object} options Options of the platform
 * @param {Function} callback
 * @param {Error} [callback.err=null]
 */
Publisher.prototype.publish = function(platform, options, callback){
    if (typeof callback !== 'function') {
        callback = function () {};
    }

    if (!platform) {
        callback(new Error(errMsg.missingPlatformArg));
        return;
    }

    if (!exports.platforms[platform]) {
        callback(new Error(errMsg.invalidPlatformArg));
        return;
    }

    var self = this;
    preferences.read( {silent: true}, function(prefs) {
        var SubPublisher = exports.platforms[platform]['Publisher' + platform];
        var subPublisher = new SubPublisher(self.configurator, prefs, options);
        subPublisher.publish(callback);
    });
};

Publisher.prototype.constructor = Publisher;
exports.Publisher = Publisher;
