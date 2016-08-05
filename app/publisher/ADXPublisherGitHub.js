var Client          = require('github');
var common          = require('../common/common.js');
var errMsg          = common.messages.error;
var Configurator	= require('../configurator/ADXConfigurator.js').Configurator;
var fs              = require('fs');
var path            = require('path');
var git             = require('simple-git');

function PublisherGitHub(configurator, options) {
    
    if(!configurator){
        throw new Error(errMsg.invalidConfiguratorArg);
    }
    
    if (!(configurator instanceof Configurator)) {
        throw errMsg.invalidConfiguratorArg;
    }
    

    var default_options = {
        username: "LouisAskia",
        useremail: "louis@askia.com",
        message: "default_message",
        remoteUri: "https://github.com/LouisAskia/",
        token: "2d54d307120409df5104e3db380c0b04827eb8eb"
    };

    options = options || {};

     for (var option in default_options) {
         if (default_options.hasOwnProperty(option)) {
             if (!options[option]) {
                 options[option] = default_options[option];
             }
         }
    }

    this.options        = options;
    this.configurator   = configurator;
    this.git            = git(this.configurator.path.replace(/\\/g, "/"));
    this.github         = new Client({});
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
            self.git.addConfig('user.name', self.options.username)
                .addConfig('user.email', self.options.useremail)
                .add("./*")
                .commit(self.options.message, './*')
            var params = [self.options.remoteUri+self.configurator.get().info.name, 'master'];
            if(self.options.force) {
                params.push('-f');
            }
            self.git.push(params, function(err, res) {
                if(err){
                    callback(err);
                }
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
                });
            }
            callback(err);
        }
        callback(null);
    });
};


//Make it public
exports.PublisherGitHub = PublisherGitHub ;