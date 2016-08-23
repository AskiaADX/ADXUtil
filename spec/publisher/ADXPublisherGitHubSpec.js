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
    
    describe("#Constructor", function(){
       
        
        it("should throw an error when the `configurator` argument is missing", function(){
            expect(function(){
                publisherGitHub = new PublisherGitHub();  
            }).toThrow(errMsg.missingConfiguratorArg);
        });
        
        it("should throw an error when the `configurator` argument is invalid", function(){
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
            
        });
        
        
        it("should call git#init if there is not a `.git` folder in the adc folder", function() {
            
            
            
            spies.gitInit = spyOn(publisherGitHub.git, "init");
            
            spies.gitPush = spyOn(publisherGitHub.git, "push").andCallFake(function(params, cb) {
                cb(null, "");
            });
            spies.gitAddConfig = spyOn(publisherGitHub.git, "addConfig").andCallFake(function(key, value, cb){
               cb(null,""); 
            });
            
            spies.checkIfRepoExists = spyOn(PublisherGitHub.prototype, "checkIfRepoExists").andCallFake(function(cb) {
                cb(null);
            });
            
            spies.dirStats = spyOn(fs, "stat").andCallFake(function(dir, cb) {
                cb(null, {
                    isDirectory: function(){
                        return false;
                    }
                });
            });
            
            spies.config = spyOn(publisherGitHub.configurator, "get").andReturn({info:{name:"a name"}});
         
            publisherGitHub.publish(function(err) {
                
               expect(spies.gitInit).toHaveBeenCalled(); 
            });
            
        });
        
       /* it("should not call git#init if there is a `.git` folder in the adc folder", function(){
            
        });
        
        it("should call #checkIfRepoExists in any cases", function(){
            
        });*/
    });
    
    
    
    describe("#checkIfRepoExists", function(){
        
    });
    
    
    
});