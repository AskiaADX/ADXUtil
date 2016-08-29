describe("ADXPublisherZenDesk", function() {
    var fs					= require('fs'),
        spies				= {},
        options				= {
            username	:	'zendesk@askia.com',
            remoteUri	:	'https://uri',
            password    :   'mdp',
            promoted    :    false,
            comments_disabled : false,
            section_title : 'a_section'
        },
        common              = require('../../app/common/common.js'),
        errMsg              = common.messages.error,
        Configurator        = require('../../app/configurator/ADXConfigurator.js').Configurator,
        PublisherZenDesk	= require('../../app/publisher/ADXPublisherZenDesk.js').PublisherZenDesk,
        zenDesk             = require('node-zendesk'),
        request             = require('request');

    beforeEach(function() {
        spies.fs = {
            readFile : spyOn(fs, 'readFile')
         };
    });


    describe("#Constructor", function() {

        it("should throw an error when the `configurator` argument is missing", function() {
            expect(function() {
            	var publisherZenDesk = new PublisherZenDesk();
            }).toThrow(errMsg.missingConfiguratorArg);
        });

        it("should throw an error when the `configurator` argument is invalid", function() {
            expect(function() {
            	var publisherZenDesk = new PublisherZenDesk({});
            }).toThrow(errMsg.invalidConfiguratorArg);
        });

        it("should throw an error when options are missing", function() {
            expect(function() {
                var notCompletedOptions = {
                    username	:	'zendesk@askia.com',
                    remoteUri	:	'https://uri',
                    promoted    :    false,
                    comments_disabled : false
                };
                var config = new Configurator('.');
                var publisherZenDesk = new PublisherZenDesk(config, {}, notCompletedOptions);
            }).toThrow(errMsg.missingPublishArgs + '\n missing argument : password'); //first missing arg here is password
        });

        it("should instantiate the zendesk client when everything is ok", function() {

            var config = new Configurator('.');
            spies.zendeskClient = spyOn(zenDesk, 'createClient').andReturn('');
            var publisherZenDesk = new PublisherZenDesk(config, {}, {
                username          : 'zendesk@askia.com',
                password          : 'secret',
                remoteUri	      : 'https://uri',
                promoted          : false,
                comments_disabled : false,
                section_title     : 'a section title'
            });

            expect(publisherZenDesk.options).toEqual({
                username          : 'zendesk@askia.com',
                password          : 'secret',
                remoteUri	      : 'https://uri',
                promoted          : false,
                comments_disabled : false,
                section_title     : 'a section title'
            });
            
            expect(publisherZenDesk.configurator).toBe(config);

        });
    });
    
    describe("#publish", function() {

        var config = new Configurator('.');
        var publisherZenDesk = new PublisherZenDesk(config, {}, options);


        beforeEach(function() {
             var result = [
                 {
                      name: "une_section",
                      id: 40
                 },
                 {
                     name: "section_found",
                     id: 60
                 }
            ];


            spies.listSection = spyOn(publisherZenDesk.client.sections, "list").andCallFake(function(callback) {
                callback(null, "", result);
            });

            spies.findSectionIdByTitle = spyOn(publisherZenDesk, 'findSectionIdByTitle').andCallFake(function(title, cb) {
                cb(null, 86);
            });


            spies.createJSONArticle = spyOn(PublisherZenDesk.prototype, 'createJSONArticle').andCallFake(function(cb) {
               cb(null, {
                    "article": {
                        "title": 'titre',
                        "body": 'body',
                        "promoted": false,
                        "comments_disabled": false
                    }
               });
            });

            spies.deleteArticle = spyOn(PublisherZenDesk.prototype, 'deleteArticle').andCallFake(function(title, section_id, cb) {
                cb(null);
            });


            spies.articles_create = spyOn(publisherZenDesk.client.articles, 'create').andCallFake(function(id, article, cb) {
                cb(null, "", {
                        name: "un article",
                        id: 42
                });
            });
        });



        it("should output an error when there are more than one .adc file in " + common.ADC_PATH, function() {

            spies.readDirADC = spyOn(fs, 'readdir').andCallFake(function(path, callback) {
                callback(null, ['1.adc', '2.adc']);
            });
            publisherZenDesk.publish(function(err) {
                expect(err).toBe(errMsg.badNumberOfADCFiles)
            });

        });

        it("should output an error when the .adc file is missing in " + common.ADC_PATH, function() {

              spies.readDirADC = spyOn(fs, 'readdir').andCallFake(function(path, callback) {
                    callback(null, []);
              });
              publisherZenDesk.publish(function(err) {
                    expect(err).toBe(errMsg.badNumberOfADCFiles);
              });

        });

        it("should output an error when there is more than a .qex file in " + common.QEX_PATH, function() {

            spies.readDirQEX = spyOn(fs, 'readdir').andCallFake(function(path, callback) {
                callback(null, ['1.adc', '1.qex', '2.qex']);
            });
            publisherZenDesk.publish(function(err) {
                expect(err).toBe(errMsg.badNumberOfQEXFiles);
            });

        });

        it("should output an error when there is more than a .png file begining with 'adc' in " + common.QEX_PATH, function() {

                spies.readDirPNG = spyOn(fs, 'readdir').andCallFake(function(path, callback) {
                    callback(null, ['1.adc', '1.qex', 'logo.png', 'adc-anADC.png', 'adc-an_otherADC.png']);
                });
                publisherZenDesk.publish(function(err) {
                  expect(err).toBe(errMsg.badNumberOfPicFiles);
                });
        });
    });

    describe("#uploadAvailableFiles", function() {
        
        var config = new Configurator('.');
        var publisherZenDesk = new PublisherZenDesk(config, {}, options);
        
        it("should call request#post as many times as available files", function() {
            var counter = 0
            spies.post = spyOn(request, "post").andCallFake(function(obj, cb){
                counter++;
                cb(null, null, "{}");
            });
            spies.parse = spyOn(JSON, 'parse').andReturn({article_attachment:{id:56}});
            spies.match = spyOn(String.prototype, 'match').andReturn('');
            
            spies.createReadStream = spyOn(fs, 'createReadStream').andReturn('');
            publisherZenDesk.uploadAvailableFiles(['j.adc', 'q.qex', 'adc-hello.png'], 35, function(err, attachmentsIDs) {
                expect(counter).toBe(3);    
            });
        });
        
    });
    
    describe("#deleteArticle", function() {
        
        var config = new Configurator('.');
        var publisherZenDesk = new PublisherZenDesk(config, {}, options);
        
        it("should call articles#delete when this article already exists", function() {
            spies.listBySection = spyOn(publisherZenDesk.client.articles, "listBySection").andCallFake(function(section_id, cb){
                cb(null, null, [{id : 2, name: 'amazing'}]);
            });
            spies.delete = spyOn(publisherZenDesk.client.articles, "delete").andCallFake(function(id){});
            publisherZenDesk.deleteArticle("amazing", 86, function(err){
                expect(spies.delete).toHaveBeenCalled();
            });
        });
        
        it("should output an error when there is already more than one instance of the article on the platform", function() {
            spies.listBySection = spyOn(publisherZenDesk.client.articles, "listBySection").andCallFake(function(section_id, cb){
                cb(null, null, [{id : 1, name: 'amazing'}, {id : 2, name: 'amazing'}]);
            });
            publisherZenDesk.deleteArticle("amazing", 86, function(err) {
                expect(err).toBe(errMsg.tooManyArticlesExisting); 
            });
        });
        
        it("should not call articles#delete when the article does not exist", function() {
            spies.listBySection = spyOn(publisherZenDesk.client.articles, "listBySection").andCallFake(function(section_id, cb){
                cb(null, null, [{name: 'amazing'}]);
            });
            spies.delete = spyOn(publisherZenDesk.client.articles, "delete").andCallFake(function(id){});
            publisherZenDesk.deleteArticle("an article", 86, function(err){
                expect(spies.delete).not.toHaveBeenCalled();
            });
        });

        it("should call the the callback when article has been deleted", function () {
            expect(false).toBe(true);
        });

        it("should call the the callback when article was not exists", function () {
            expect(false).toBe(true);
        });

    });
    
    describe("#findSectionIdByTitle", function() {

        var config = new Configurator('.');
        var publisherZenDesk = new PublisherZenDesk(config, {}, options);

        it("should output an error when the `title` argument is missing", function() {
            publisherZenDesk.findSectionIdByTitle('', function(err){
                expect(err).toBe(errMsg.missingSectionTitleArg);
            });
        });

        it("should output an error when the `title` argument is invalid", function() {
            publisherZenDesk.findSectionIdByTitle(12, function(err){
                expect(err).toBe(errMsg.invalidSectionTitleArg);
            });
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

    describe("#createJSONArticle",function() {

        it("should return an error if there is an error while reading the template article file", function() {
          var config = new Configurator('.');
          var publisherZenDesk = new PublisherZenDesk(config, {}, options);

          spies.fs.readFile.andCallFake(function(a, b, callback) {
             callback("a fatal error occured");
          });

          publisherZenDesk.createJSONArticle(function(err, article) {
              expect(err).toBe("a fatal error occured");
          });

        });

        it("should return a JSON object with an article pattern when everything is ok", function() {

            var config = new Configurator('.');
            var publisherZenDesk = new PublisherZenDesk(config, {}, options);

            spies.fs.readFile.andCallFake(function(a, b, callback) {
               callback(null);
            });

            spies.evalTemplate = spyOn(common, 'evalTemplate').andReturn('the-body');

            spies.infoname = spyOn(config, 'get').andReturn({
                info:{
                    name: 'test-adx'
                }
            });

            publisherZenDesk.createJSONArticle(function(err, article) {
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
