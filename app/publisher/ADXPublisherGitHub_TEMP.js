var Client          = require('../../node_modules/github/lib/index');
var common          = require('../common/common.js');
var errMsg          = common.messages.error;
var Configurator    = require('../configurator/ADXConfigurator.js').Configurator;
var fs              = require('fs');
var path            = require('path');
var async           = require('async');
var _               = require('underscore');


var default_options = {
    username: 'LouisAskia', //
    token: '3b94fab02e1cf926056ff07ce29ca4872287a8fd' //Must be a token with delete_repo permisssion
};

/**
 * Instantiate a Publisher specific to GitHub
 * @param {Configurator} configurator The configuration of the article
 * @param {Object} options Options of the platform, if the options are not specified the default_options will be loaded.
 */
function PublisherGitHub(configurator, options){
    
    if(_.isUndefined(configurator)){
        throw new Error(errMsg.missingConfiguratorArg);
    }
    
    /*if(!(configurator instanceof Configurator)){
        throw new Error(errMsg.invalidConfiguratorArg);
    }*/
    
    options = options || {} ;
    
     for(var option in default_options){
        if(!options[option]){
            options[option] = default_options[option];
        }
    }
    
    this.options        = options;
    this.github         = new Client({});
    this.configurator   = configurator;
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
    });
   
    self.checkIfRepoExists(self.configurator.get().info.name, function(err){
        if(err){
            callback(err);
            return;
        }
        self.github.repos.create({
            name: self.configurator.get().info.name,
            description: self.configurator.get().info.description.replace(/\n/g, "")
        }, function (err, repo) {
            if(err){
                if(typeof callback === "function"){
                    callback(err);
                }
            }
            else{
                PublisherGitHub.prototype.getFilesRecursively(self.configurator.path, function(err, files){
                    if(err){
                        if(typeof callback === "function"){
                            callback(err);
                        }
                    }
                    else{
                        var fnToExectute = function(iterator, cb){
                            fs.readFile(path.join(self.configurator.path,iterator), null, function(err, res){
                                if(err){
                                    if(typeof err === "function"){
                                        cb(err);
                                    }
                                }
                                else{
                                iterator = iterator.replace(/\\/g, "/").substring(1);
                                    self.github.repos.createFile({
                                        user: self.options.username,
                                        repo: self.configurator.get().info.name,
                                        path: iterator,
                                        message: "published from ADXStudio",
                                        content: new Buffer(res).toString('base64')
                                    },function(err, res){
                                        if(err){
                                            cb(err);
                                        }
                                        else{
                                            cb(null, res);
                                        }
                                    });
                                }
                            });
                        };
                        async.eachSeries(files, fnToExectute, function(err, res){
                            if(err){
                                callback(err);
                            }                            
                        });
                    }
                });    
            } 
        });
    });
};




/**
 * Check if the repo exists and delete it if it exists
 * @param {String} name The name of the repo to test
 * @param {Function} callback
 * @param {Error} [callback.err=null]
 */
PublisherGitHub.prototype.checkIfRepoExists = function(name, callback) {
    
    var self = this ;
    
    self.github.repos.getAll({
        affiliation: "owner"
    },function(err, repos){
        if(err){
            callback(err);
            return;
        }
        for(var i in repos){
            if(repos[i].name === name){
                self.github.repos.delete({
                    repo: repos[i].name,
                    user: self.options.username
                },function(err, res){ 
                    console.log(err, res);
                    if(err){
                        callback(err);
                        return;
                    }
                    callback(null);
                });
            }
        }
        callback(null);
    });
}


/**
 * List all the files recursively in a directory with the entire path
 * @param {String} dir the name of the directory to search with all of the subdirectories
 * @param {Function} done
 */
PublisherGitHub.prototype.walk = function(dir, done) {
    
  var results = [];
    
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          PublisherGitHub.prototype.walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};


/**
 * List all the files recursively in a directory with a relative path whose root is the directory
 * @param {String} dir the name of the directory substract in order to have only the suffix
 * @param {Function} cb 
 */
PublisherGitHub.prototype.getFilesRecursively = function(dir, cb){
    
    var res = [];
    
    PublisherGitHub.prototype.walk(dir, function(err, results){
        if(err){
            cb(err, null);  
        }
        else{
            results.forEach(function(t){
                res.push(t.replace(path.resolve(dir), ''));
            });
            cb(null, res);
        }
    });
};

//Make it public
exports.PublisherGitHub = PublisherGitHub ;