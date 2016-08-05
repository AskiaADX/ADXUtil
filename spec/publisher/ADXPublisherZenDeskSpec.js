describe("ADXPublisherZenDesk", function(){
   
    //TODO : watch if all of these requires are really needed
    var fs					=	require('fs'),
        Publisher 			=	require("../../app/publisher/ADXPublisher.js").Publisher,
        spies				=	{},
        options				=	{},
        common				=	require('../../app/common/common.js'),
        errMsg				=	common.messages.error,
        Configurator 		=   require('../../app/configurator/ADXConfigurator.js').Configurator,
        PublisherZenDesk	=	require('../../app/publisher/ADXPublisherZenDesk.js').PublisherZenDesk,
        zenDesk             =   require('node-zendesk'),
        client;
    
    
    var options = {
            username	:	'zendesk@askia.com',
            remoteUri	:	'https://uri',
            password    :   'mdp',
            promoted    :    false,
            comments_disabled : false,
            section_title : 'a_section'
    };
    
    beforeEach(function(){
        spies.fs = {
            readFile : spyOn(fs, 'readFile')
         };
        
         client = zenDesk.createClient({
            username	:	"toto",
            password    :   "pwd",
            remoteUri	:	"https://uri",
            helpcenter 	:	true
        });
    
        
        
    });
    
    describe("#Constructor", function(){
       
        it("should throw an error when the `configurator` argument is missing", function(){
            expect(function(){
            	var publisherZenDesk = new PublisherZenDesk();    
            }).toThrow(errMsg.missingConfiguratorArg);
        });
        
        it("should throw an error when the `configurator` argument is invalid", function(){
            expect(function(){
            	var publisherZenDesk = new PublisherZenDesk({});    
            }).toThrow(errMsg.invalidConfiguratorArg);
        });
        
        it("should correctly instantiate the options attributs", function() {
            var config = new Configurator('.');
            var publisherZenDesk = new PublisherZenDesk(config);
        });
        
    });
    
    
    describe("#publish", function(){
        
        var config = new Configurator('.');
        var publisherZenDesk = new PublisherZenDesk(config, options);
        
        it("should throw an error when the .adc file is missing in " + common.ADC_PATH, function(){
            expect(function(){
                spies.readDirADC = spyOn(fs, 'readdir').andCallFake(function(path, callback) {
                    callback(null, []);
                });
               
                
            }).toThrow(errMsg.badNumberOfADCFiles);
        });
        
        it("should throw an error when there is more than a .qex file in " + common.QEX_PATH, function(){
            expect(function(){
                
            }).toThrow(errMsg.badNumberOfQEXFiles);
        });
        
        it("should throw an error when there is more than a .png file begining with 'adc' in " + common.QEX_PATH, function(){
            expect(function(){
                
            }).toThrow(errMsg.badNumberOfPNGFiles);
        });
        
    });
   
    describe("#findSectionIdByTitle", function(){
        
        var config = new Configurator('.');
        var publisherZenDesk = new PublisherZenDesk(config, options);
        
        it("should throw an error when the `title` argument is missing", function() {
            expect(function(){
                publisherZenDesk.findSectionIdByTitle();
            }).toThrow(errMsg.missingSectionTitleArg);
        });
        
        it("should throw an error when the `title` argument is invalid", function() {
            expect(function(){
                publisherZenDesk.findSectionIdByTitle({});
            }).toThrow(errMsg.invalidSectionTitleArg);
        });

        it("should output an id when the section is found", function() {
            
            var result = [
                {
                    name: "une_section",
                    id: 86
                },
                {
                    name: "section_found",
                    id: 42
                }
            ];
            
            
            spies.listSection = spyOn(publisherZenDesk.client.sections, "list").andCallFake(function(callback) {
                callback(null, "", result);
            });
            
            publisherZenDesk.findSectionIdByTitle("section_found", function(err, res) {
                expect(res).toBe(42);
            });
        });
       
             
        it("should output an error when the section doesn't exist", function() {
            
            spies.listSection = spyOn(publisherZenDesk.client.sections, "list").andCallFake(function(callback) {
                callback(null, "", "");
            });
                        
            publisherZenDesk.findSectionIdByTitle("t", function(err, res) {
                expect(err).toBe(errMsg.unexistingSection);
            });
            
        });
        
    });
    
    describe("#createArticle",function(){
        
        it("should return a JSON object with an article pattern", function() {
            
            var config = new Configurator('.');
            var publisherZenDesk = new PublisherZenDesk(config, options);
            
            config.info = {
                name:  'test-adx'
            };
                
            spies.fs.readFile.andCallFake(function(a, b, callback) {
               callback(null);
            });
            
            spies.evalTemplate = spyOn(common, 'evalTemplate').andCallFake(function(input, configurator) {
                return "the-body" ;
            });
            
            spies.infoname = spyOn(config.info, 'name').andReturn('test-adx');
            
            publisherZenDesk.createArticle(function(err, article) {
                expect(article).toEqual({
                    article : {
                        title: 'test-adx',
                        body: 'the-body',
                        promoted: false,
                        comments_disabled : false
                    }
                });
            });
            
        });
    });
    
});