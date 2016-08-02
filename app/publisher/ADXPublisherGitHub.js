var Client          = require('../../node_modules/github/lib/index');
var common          = require('../common/common.js');
var errMsg          = common.messages.error;
var Configurator    = require('../configurator/ADXConfigurator.js').Configurator;
var fs              = require('fs');
var path            = require('path');
var async           = require('async');
var _               = require('underscore');
var git             = require('simple-git')(path.join(__dirname,'../../../ADCs/adc2_gender/').replace(/\\/g, "/"));




/*git.branch(function(err, res){
    console.log(res);
});*/


var default_options = {
    username: "LouisAskia",
    useremail: "louis@askia.com",
    message: "default_message",
    baseURI: "https://github.com/LouisAskia/"
}

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
    
    this.options = options ;
    this.configurator = configurator ;
    this.git    = require('simple-git')(this.configurator.path.replace(/\\/g, "/"));
    
}


PublisherGitHub.prototype.publish = function(callback){
    
    
    var self = this ;
    
    if(!_.contains(self.getDirectories(self.configurator.path), '.git')){
        self.git.init();
    }
    
    self.git.pull(self.options.baseURI+self.configurator.get().info.name, 'master');
    self.git.addConfig('user.name', self.options.username)
            .addConfig('user.email', self.options.useremail)
            .add("./*")
            .commit(self.options.message, './*')
            .push([self.options.baseURI+self.configurator.get().info.name, 'master'], function(err, res){});                  
}

PublisherGitHub.prototype.getDirectories = function(srcpath) {
  return fs.readdirSync(srcpath).filter(function(file) {
    return fs.statSync(path.join(srcpath, file)).isDirectory();
  });
};



//Make it public
exports.PublisherGitHub = PublisherGitHub ;