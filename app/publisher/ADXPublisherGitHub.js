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

    if (!configurator) {
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
    var neededOptions = ['username', 'useremail', 'organization', 'password', 'message'];
    for (var i = 0, l = neededOptions.length; i < l; i++) {
        var neededOption = neededOptions[i];
        if (!this.options.hasOwnProperty(neededOption)) {
            throw new Error(errMsg.missingPublishArgs + '\n missing argument : ' + neededOption);
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
            if (err) {
                callback(err);
                return;
            }
            self.git.addConfig('user.name', self.options.username, function(err, res) {
                if (err) {
                    callback(err);
                    return;
                }
                self.git.addConfig('user.email', self.options.useremail, function(err, res) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    self.git.add("./*", function(err, res) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        self.git.commit(self.options.message, './*', function(err, res) {
                            if (err) {
                                callback(err);
                                return;
                            }
                            var params = ['https://github.com/' + self.options.organization + '/' + self.configurator.get().info.name, 'master'];
                            self.git.push(params, function(err, res) {
                                if (err) {
                                    callback(err);
                                    return;
                                }
                                callback(null);
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
            self.git.init(function(err, res){
                if(err){
                    callback(err);
                    return;
                }
                commitPush();
            });
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
        type: "basic",
        username: self.options.username,
        password: self.options.password
    });

    self.github.repos.getForOrg({
        org: self.options.organization
    }, function(err, repos) {
        if(err) {
            callback(err);
            return;
        }
        for(var i = 0, j = repos.length ; i < j ; ++i) {
            if(repos[i].name === name) {
                callback(null);
                return;
            }
        }
        
        self.github.repos.createForOrg({
            org: self.options.organization,
            name: name,
            description: description
        }, function(err, res) {
            if(err) {
                callback(err);
                return;
            }
            callback(null);
        });
    });
};


//Make it public
exports.PublisherGitHub = PublisherGitHub ;
