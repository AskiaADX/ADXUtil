var Client          = require('github');
var common          = require('../common/common.js');
var errMsg          = common.messages.error;
var Configurator    = require('../configurator/ADXConfigurator.js').Configurator;
var fs              = require('fs');
var path            = require('path');
var git             = require('simple-git');

function PublisherGitHub(configurator, options) {
    if (!(configurator instanceof Configurator)) {
        throw errMsg.invalidConfiguratorArg;
    }

    var default_options = {
        username: "LouisAskia",
        useremail: "louis@askia.com",
        message: "default_message",
        remoteUri: "https://github.com/LouisAskia/",
        token: "10f6c06b5c8a86c951682671b4d46d0ef90b9ffe"
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

    self.github.authenticate({
        type: "oauth",
        token: self.options.token
    }, function (err) {

        if (err) {
            callback(err);
            return;
        }

        var gitDir = path.join(self.configurator.path, '.git');
        fs.stat(gitDir, function (err, stat) {
            if (err) {
                callback(err);
                return;
            }

            if (!stat.isDirectory()) {
                self.git.init(commitPush);
                return;
            }

            commitPush();
        });
    });

    function commitPush() {
        self.checkIfRepoExists(function(err){
            if(err){
                callback(err);
                return;
            }
            self.git.addConfig('user.name', self.options.username)
                .addConfig('user.email', self.options.useremail)
                .add("./*")
                .commit(self.options.message, './*')
            var params = [self.options.remoteUri+self.configurator.get().info.name, 'master'];
            if(self.options.force){
                params.push('-f');
            }
            self.git.push(params, function(err, res){
                if(err){
                    callback(err);
                }
            });
        });
    }


};


/**
 * Check if the repo exists and create it if it does not exist yet
 * @param {Function} callback
 * @param {Error} [callback.err=null]
 */
PublisherGitHub.prototype.checkIfRepoExists = function(callback) {
    
    var self        = this;

    self.github.repos.getAll({
        affiliation: "owner,collaborator,organization_member"
    }, function(err, repos) {
        if (err) {
            callback(err);
            return;
        }

        var configInfo  = self.configurator.get();
        var name        = configInfo.name;
        var description = configInfo.description.replace(/\n/g, "");
        var created     = false;

        for(var i in repos){
            if(repos[i].name === name){
                created = true ;
            }
        }
        if(!created){
            self.github.repos.create({
                name: name,
                description: description
            },function(err, res){
                if(err){
                    return;
                }
                callback(null);
            });
        }
        callback(null);
    });
};

//Make it public
exports.PublisherGitHub = PublisherGitHub ;

exports.test = function () {
    var options = {
        username: "LouisAskia",
        useremail: "louis@askia.com",
        message: "default_message",
        remoteUri: "https://github.com/LouisAskia/",
        token: "0ab7d58b9d999349881ebdaca8933eac371b5b4a"
    };

    var github         = new Client({});

    github.authenticate({
        type: "oauth",
        token: options.token
    });


    github.repos.get({
        user        : options.username,
        repo        : 'Gender26'
    },function(err, res){
        console.log(arguments);
    });
};