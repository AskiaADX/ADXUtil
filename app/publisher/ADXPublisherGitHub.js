var Client          = require('../../node_modules/github/lib/index');
var common          = require('../common/common.js');
var errMsg          = common.messages.error;
var Configurator    = require('../configurator/ADXConfigurator.js').Configurator;
var fs              = require('fs');
var path            = require('path');
var async           = require('async');
var git             = require('simple-git');

function PublisherGitHub(configurator, options) {
    if (!(configurator instanceof Configurator)) {
        throw errMsg.invalidConfiguratorArg;
    }

    var default_options = {
        username: "LouisAskia",
        useremail: "louis@askia.com",
        message: "default_message",
        baseURI: "https://github.com/LouisAskia/"
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
}


PublisherGitHub.prototype.publish = function(callback){
    var self = this ;
    var gitDir = path.join(self.configurator.path, '.git');

    function commitPush() {
        self.git.addConfig('user.name', self.options.username)
            .addConfig('user.email', self.options.useremail)
            .add("./*")
            .commit(self.options.message, './*')
            .push([self.options.baseURI+self.configurator.get().info.name, 'master'], callback);
    }

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
};

//Make it public
exports.PublisherGitHub = PublisherGitHub ;