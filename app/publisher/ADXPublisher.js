var common				=	require('../common/common.js');
var errMsg				=	common.messages.error;
var Configurator		=	require('../configurator/ADXConfigurator.js').Configurator;


var platforms = {
        'ZenDesk'   :   require('./ADXPublisherZenDesk.js'),
        'GitHub'    :   require('./ADXPublisherGitHub.js')
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
    if (!platform) {
        throw new Error(errMsg.missingPlatformArg);
    }
    
    if (!platforms[platform]) {
        throw new Error(errMsg.invalidPlatformArg);
    }
    
    var SubPublisher = platforms[platform]['Publisher' + platform];
    var subPublisher = new SubPublisher(this.configurator, options);
    subPublisher.publish(callback);
};

Publisher.prototype.constructor = Publisher;
exports.Publisher = Publisher;
