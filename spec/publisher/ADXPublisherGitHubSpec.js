describe("ADXPublisherGitHub", function() {
    
    var PublisherGitHub = require('../../app/publisher/ADXPublisherGitHub.js').PublisherGitHub;
    var common = require('../../app/common/common.js');
    var errMsg = common.messages.error;
    var spies = {};
    var Configurator = require('../../app/configurator/ADXConfigurator.js').Configurator;
    var git = require('simple-git');
    var options = {
        username : "a user",
        organization : "fakeAskiaOrg",
        useremail : "user@email.com",
        message : "a msg",
        password : "amazingSecret"
    }
    var fs = require('fs');
        
    describe("#Constructor", function() {
       
        
        it("should throw an error when the `configurator` argument is missing", function() {
            expect(function() {
                publisherGitHub = new PublisherGitHub();  
            }).toThrow(errMsg.missingConfiguratorArg);
        });
        
        it("should throw an error when the `configurator` argument is invalid", function() {
            expect(function() {
                publisherGitHub = new PublisherGitHub({});  
            }).toThrow(errMsg.invalidConfiguratorArg);
        });
        
        it("should throw an error when options are missing", function() {
            expect(function() {
                var notCompletedOptions = {
                    username	:	'fakeUser',
                };
                var config = new Configurator('.');
                var publisherGitHub = new PublisherGitHub(config, {}, notCompletedOptions);
            }).toThrow(errMsg.missingPublishArgs + '\n missing argument : useremail' );
        });
        
    });
    
    describe("#publish", function() {
        
        var config = new Configurator('.');
        var publisherGitHub = new PublisherGitHub(config, {}, options);
        
        beforeEach(function() {
            spies.gitInit = spyOn(publisherGitHub.git, "init").andCallFake(function(cb) {
                cb(null);
            });
            
            spies.gitPush = spyOn(publisherGitHub.git, "push").andCallFake(function(params, cb) {
                cb(null, "");
            });
            spies.gitAddConfig = spyOn(publisherGitHub.git, "addConfig").andCallFake(function(key, value, cb) {
               cb(null, ""); 
            });
            spies.gitCommit = spyOn(publisherGitHub.git, "commit").andCallFake(function(msg, files, cb) {
               cb(null, ""); 
            });
            spies.gitAdd = spyOn(publisherGitHub.git, "add").andCallFake(function(files, cb) {
               cb(null, ""); 
            });
            spies.checkIfRepoExists = spyOn(PublisherGitHub.prototype, "checkIfRepoExists").andCallFake(function(cb) {
                cb(null);
            });
            
            spies.config = spyOn(publisherGitHub.configurator, "get").andReturn({info:{name:"a name"}});
        });
        
        
        it("should call git#init if there is not a `.git` folder in the adc folder", function() {
            
            spies.dirStats = spyOn(fs, "stat").andCallFake(function(dir, cb) {
                cb(null, {
                    isDirectory: function(){
                        return false;
                    }
                });
            });
            
            publisherGitHub.publish(function(err) {
                expect(spies.gitInit).toHaveBeenCalled();
            });
           
        });
        
        it("should not call git#init if there is a `.git` folder in the adc folder", function() {
            spies.dirStats = spyOn(fs, "stat").andCallFake(function(dir, cb) {
                cb(null, {
                    isDirectory: function(){
                        return true;
                    }
                });
            });
            
            publisherGitHub.publish(function(err) {
                expect(spies.gitInit).not.toHaveBeenCalled();
            });
        });
        
        it("should always check if remote repo exists before acting", function() {
            
            
            spies.dirStats = spyOn(fs, "stat").andCallFake(function(dir, cb) {
                cb(null);
            });
            publisherGitHub.publish(function(err) {
                expect(spies.checkIfRepoExists).toHaveBeenCalled();
            });
        });
        
    });
    
    
    
    describe("#checkIfRepoExists", function() {
        
        var config = new Configurator('.');
        var publisherGitHub = new PublisherGitHub(config, {}, options);
        
        beforeEach(function() {
            spies.config = spyOn(publisherGitHub.configurator, "get").andReturn({
                info:{
                    name: "a name",
                    description: "a description"
                }
            });
            
            spies.authenticate = spyOn(publisherGitHub.github, "authenticate").andCallFake(function(){});
            
            spies.create = spyOn(publisherGitHub.github.repos, "createForOrg").andCallFake(function(obj, cb) {
                cb(null);
            });
        });
        
        it("should create a repo when it doest not exist yet", function() {
            
            spies.get = spyOn(publisherGitHub.github.repos, 'get').andCallFake(function(obj, cb) {
                cb(null); 
            });
            
            publisherGitHub.checkIfRepoExists(function(err) {
                expect(spies.create).not.toHaveBeenCalled(); 
                expect(err).toBe(null);
            });
            
        });
        
        it("should not create a repo if it already exists", function() {
            
            spies.get = spyOn(publisherGitHub.github.repos, 'get').andCallFake(function(obj, cb) {
                cb({code: 404}); 
            });
            
            publisherGitHub.checkIfRepoExists(function(err) {
                expect(spies.create).toHaveBeenCalled(); 
                expect(err).toBe(null);
            });
            
            
        });
        
    });
    
});