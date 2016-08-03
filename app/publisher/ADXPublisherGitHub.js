var Client          = require('../../node_modules/github/lib/index');
var common          = require('../common/common.js');
var errMsg          = common.messages.error;
var Configurator    = require('../configurator/ADXConfigurator.js').Configurator;
var fs              = require('fs');
var path            = require('path');
var _               = require('underscore');
var git             = require('simple-git')(path.join(__dirname,'../../../ADCs/adc2_gender/').replace(/\\/g, "/"));



var default_options = {
    username: "LouisAskia",
    useremail: "louis@askia.com",
    message: "default_message",
    remoteUri: "https://github.com/LouisAskia/",
    token: "10f6c06b5c8a86c951682671b4d46d0ef90b9ffe"
}



/**
 * Instantiate a Publisher specific to GitHub
 * @param {Configurator} configurator The configuration of the article
 * @param {Object} options Options of the platform, if the options are not specified the default_options will be loaded.
 */
function PublisherGitHub(configurator, options){
    
    if(_.isUndefined(configurator)){
        throw new Error(errMsg.missingConfiguratorArg);
    }
    
    
    options = options || {} ;
    
     for(var option in default_options){
        if(!options[option]){
            options[option] = default_options[option];
        }
    }
    
    this.options            = options ;
    this.configurator       = configurator ;
    this.git                = require('simple-git')(this.configurator.path.replace(/\\/g, "/"));
    this.github             = new Client({});
    
}


/**
 * Publish the article on the GitHub platform
 * @param {Function} callback
 * @param {Error} [callback.err=null]
*/
PublisherGitHub.prototype.publish = function(callback){
    
    
    var self = this ;
    
    self.github.authenticate({
        type: "oauth",
        token: self.options.token
    },function(err, res){
        console.log(err,res);
    });
    
    if(!_.contains(self.getDirectories(self.configurator.path), '.git')){
        self.git.init();
    }
    
   self.checkIfRepoExists(self.configurator.get().info.name, self.configurator.get().info.description.replace(/\n/g, ""), function(err){
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


/**
 * Get the sub directories of a directory
 * @param {String | Buffer} srcpath The path of the directory to search in
 */
PublisherGitHub.prototype.getDirectories = function(srcpath) {
  return fs.readdirSync(srcpath).filter(function(file) {
    return fs.statSync(path.join(srcpath, file)).isDirectory();
  });
};


/**
 * Check if the repo exists and create it if it does not exist yet
 * @param {String} name The name of the repo to test
 * @param {Function} callback
 * @param {Error} [callback.err=null]
 */
PublisherGitHub.prototype.checkIfRepoExists = function(name, description, callback) {
    
    var self = this ;
    
    var created = false ;
    self.github.repos.getAll({
        affiliation: "owner,collaborator,organization_member"
    },function(err, repos){
        if(err){
            callback(err);
            return;
        }
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