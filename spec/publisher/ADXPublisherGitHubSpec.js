describe("ADXPublisherGitHub", function(){
    
    var PublisherGitHub = require('../../app/publisher/ADXPublisherGitHub.js').PublisherGitHub;
    var common = require('../../app/common/common.js');
    var errMsg = common.messages.error;
    var spies = {};
    var Configurator = require('../../app/configurator/ADXConfigurator.js').Configurator;
    var git = require('simple-git');
    var options = {
        username : "a user",
        remoteUri : "http://uri",
        useremail : "user@email.com",
        message : "a msg",
        token : "0v5ev0z6505g50rcz9841ht"
    }
    var fs = require('fs');
        
    describe("#Constructor", function() {
       
        
        it("should throw an error when the `configurator` argument is missing", function() {
            expect(function(){
                publisherGitHub = new PublisherGitHub();  
            }).toThrow(errMsg.missingConfiguratorArg);
        });
        
        it("should throw an error when the `configurator` argument is invalid", function() {
            expect(function(){
                publisherGitHub = new PublisherGitHub({});  
            }).toThrow(errMsg.invalidConfiguratorArg);
        });
        
        it("should throw an error when options are missing", function() {
            expect(function(){
                var notCompletedOptions = {
                    username	:	'fakeUser',
                    remoteUri	:	'https://uri',
                };
                var config = new Configurator('.');
                var publisherZenDesk = new PublisherGitHub(config, {}, notCompletedOptions);
            }).toThrow(errMsg.missingPublishArgs);
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
            
            spies.create = spyOn(publisherGitHub.github.repos, "create").andCallFake(function(){});
        });
        
        it("should create a repo when it doest not exist yet", function() {
           
            spies.get = spyOn(publisherGitHub.github.repos, "get").andCallFake(function(params, cb) {
                cb({
                    code: 404,
                    status: "Not Found"
                });
            });
            
            publisherGitHub.checkIfRepoExists(function(err) {
                expect(spies.create).toHaveBeenCalled(); 
            });
            
        });
        
        it("should not create a repo if it already exists", function() {
            
            spies.get = spyOn(publisherGitHub.github.repos, "get").andCallFake(function(params, cb) {
                cb(null);
            });
                     
            publisherGitHub.checkIfRepoExists(function(err){
                expect(spies.create).not.toHaveBeenCalled(); 
            });
            
        });
        
    });
    
    
    
});