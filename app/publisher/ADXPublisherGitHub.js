var Client          = require('github');
var common          = require('../common/common.js');
var errMsg          = common.messages.error;
var Configurator	= require('../configurator/ADXConfigurator.js').Configurator;
var fs              = require('fs');
var path            = require('path');
var git             = require('simple-git');


/**
 * Instantiate a PublisherGitHub
 * @param {Configurator} configurator the configuration of the article
 * @param {Object} preferences User preferences
 * @param {Object} options Options of the platform, if the options are not specified the user preferences will be loaded.
 */
function PublisherGitHub(configurator, preferences, options) {

    if(!configurator){
        throw new Error(errMsg.missingConfiguratorArg);
    }

    if (!(configurator instanceof Configurator)) {
        throw new Error(errMsg.invalidConfiguratorArg);
    }

    this.options = options || {};
    this.configurator = configurator;
    
      if (preferences) {
        for (var option in preferences.github) {
            if (preferences.github.hasOwnProperty(option)) {
                if (!(option in this.options)) {
                    this.options[option] = preferences.github[option];
                }
            }
        }
    }

    // All of these options must be present either in the command line either in the preference file of the user
    var neededOptions = ['username', 'useremail', 'remoteUri', 'token', 'message'];
    for (var neededOption in neededOptions) {
        if (neededOptions.hasOwnProperty(neededOption)) {
            if (!this.options.hasOwnProperty(neededOptions[neededOption])) {
                throw new Error(errMsg.missingPublishArgs);
            }
        }
    }
    
    this.git        = git(this.configurator.path.replace(/\\/g, "/"));
    this.github     = new Client({});
}


/**
 * Publish the article on the GitHub platform
 * @param {Function} callback
 * @param {Error} [callback.err=null]
*/
PublisherGitHub.prototype.publish = function(callback) {

    var self = this ;

    function commitPush() {
        self.checkIfRepoExists(function(err) {
            if(err) {
                callback(err);
                return;
            }
            self.git.addConfig('user.name', self.options.username, function(err, res){
                if(err) {
                    callback(err);
                    return;
                }
                self.git.addConfig('user.email', self.options.useremail, function(err, res){
                    if(err) {
                        callback(err);
                        return;
                    }
                    self.git.add("./*", function(err, res){
                        if(err) {
                            callback(err);
                            return;
                        }
                        self.git.commit(self.options.message, './*', function(err, res){
                            if(err) {
                                callback(err);
                                return;
                            }
                            var params = [self.options.remoteUri+self.configurator.get().info.name, 'master'];
                            if(self.options.force) {
                                params.push('-f');
                            }
                            self.git.push(params, function(err, res) {
                                if(err){
                                    callback(err);
                                    return;
                                }
                            });
                        });
                    });
                });
            });
        });
    };

    var gitDir = path.join(self.configurator.path, '.git');

    fs.stat(gitDir, function (err, stat) {

        if (stat && stat.isDirectory()) {
            commitPush();
        }
        else{
            self.git.init(commitPush());
        }
    });
};


/**
 * Check if the repo exists and create it if it does not exist yet
 * @param {Function} callback
 * @param {Error} [callback.err=null]
 */
PublisherGitHub.prototype.checkIfRepoExists = function(callback) {
    var self        = this;
    var configInfo  = self.configurator.get();
    var name        = configInfo.info.name;
    var description = configInfo.info.description.replace(/\n/g, "");

    self.github.authenticate({
        type: "oauth",
        token: self.options.token
    });

    self.github.repos.get({
        user        : self.options.username,
        repo        : name
    },function(err){
        if (err) {
            if (err.code === 404 && err.status === 'Not Found') {
                self.github.repos.create({
                    name: name,
                    description: description
                },function(err, res){
                    if (err) {
                        callback(err);
                        return;
                    }
                    callback(null);
                    return;
                });
            }
            callback(err);
            return;
        }
        callback(null);
    });
};


//Make it public
exports.PublisherGitHub = PublisherGitHub ;
