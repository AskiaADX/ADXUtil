describe("ADXPublisherZenDesk", function() {
    var fs					=	require('fs'),
        spies				=	{},
        options				=	{
            username	:	'zendesk@askia.com',
            remoteUri	:	'https://uri',
            password    :   'mdp',
            promoted    :    false,
            comments_disabled : false,
            section_title : 'a_section'
        },
        common            =	require('../../app/common/common.js'),
        errMsg				    =	common.messages.error,
        Configurator      = require('../../app/configurator/ADXConfigurator.js').Configurator,
        PublisherZenDesk	=	require('../../app/publisher/ADXPublisherZenDesk.js').PublisherZenDesk,
        zenDesk           = require('node-zendesk');

    beforeEach(function(){
        spies.fs = {
            readFile : spyOn(fs, 'readFile')
         };
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

        it("should throw an error when options are missing", function() {
            expect(function(){
                var notCompletedOptions = {
                    username	:	'zendesk@askia.com',
                    remoteUri	:	'https://uri',
                    promoted    :    false,
                    comments_disabled : false
                };
                // neededOptions = ['username', 'password', 'remoteUri', 'promoted', 'comments_disabled', 'section_title'];
                var config = new Configurator('.');
                var publisherZenDesk = new PublisherZenDesk(config, {}, notCompletedOptions);
            }).toThrow(errMsg.missingPublishArgs);
        });

        it("should instantiate the zendesk client when everything is ok", function() {

            var config = new Configurator('.');
            spies.zendeskClient = spyOn(zenDesk, 'createClient').andReturn('');
            var publisherZenDesk = new PublisherZenDesk(config, {}, {
                username          : 'zendesk@askia.com',
                password          : 'secret',
                remoteUri	        : 'https://uri',
                promoted          : false,
                comments_disabled : false,
                section_title     : 'a section title'
            });

            expect(publisherZenDesk.options).toEqual({
                username          : 'zendesk@askia.com',
                password          : 'secret',
                remoteUri	        : 'https://uri',
                promoted          : false,
                comments_disabled : false,
                section_title     : 'a section title'
            });
            expect(publisherZenDesk.configurator).toBe(config);

        });
    });

    describe("#publish", function(){

        var config = new Configurator('.');
        var publisherZenDesk = new PublisherZenDesk(config, {}, options);


        beforeEach(function(){
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

            spies.findSectionIdByTitle = spyOn(publisherZenDesk, 'findSectionIdByTitle').andCallFake(function(title, cb){
                cb(null, 86);
            });


            spies.createArticle = spyOn(PublisherZenDesk.prototype, 'createArticle').andCallFake(function(cb){
               cb(null, {
                    "article": {
                        "title": 'titre',
                        "body": 'body',
                        "promoted": false,
                        "comments_disabled": false
                    }
               });
            });

            spies.checkIfArticleExists = spyOn(PublisherZenDesk.prototype, 'checkIfArticleExists').andCallFake(function(title, section_id, cb){
                cb(null);
            });


            spies.articles_create = spyOn(publisherZenDesk.client.articles, 'create').andCallFake(function(id, article, cb){
                cb(null, "", {
                        name: "un article",
                        id: 42
                });
            });
        });



        it("should output an error when there are more than one .adc file in " + common.ADC_PATH, function(){

            spies.readDirADC = spyOn(fs, 'readdir').andCallFake(function(path, callback) {
                callback(null, ['1.adc', '2.adc']);
            });
            publisherZenDesk.publish(function(err){
                expect(err).toBe(errMsg.badNumberOfADCFiles)
            });

        });

        it("should output an error when the .adc file is missing in " + common.ADC_PATH, function(){

              spies.readDirADC = spyOn(fs, 'readdir').andCallFake(function(path, callback) {
                    callback(null, []);
              });
              publisherZenDesk.publish(function(err){
                    expect(err).toBe(errMsg.badNumberOfADCFiles);
              });

        });

        it("should output an error when there is more than a .qex file in " + common.QEX_PATH, function(){

            spies.readDirQEX = spyOn(fs, 'readdir').andCallFake(function(path, callback) {
                callback(null, ['1.adc', '1.qex', '2.qex']);
            });
            publisherZenDesk.publish(function(err){
                expect(err).toBe(errMsg.badNumberOfQEXFiles);
            });

        });

        it("should output an error when there is more than a .png file begining with 'adc' in " + common.QEX_PATH, function(){

                spies.readDirPNG = spyOn(fs, 'readdir').andCallFake(function(path, callback) {
                    callback(null, ['1.adc', '1.qex', 'logo.png', 'adc-anADC.png', 'adc-an_otherADC.png']);
                });
                publisherZenDesk.publish(function(err){
                  expect(err).toBe(errMsg.badNumberOfPicFiles);
                });
        });
    });

    describe("#findSectionIdByTitle", function(){

        var config = new Configurator('.');
        var publisherZenDesk = new PublisherZenDesk(config, {}, options);

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

        it("should return an error if there is an error while reading the template article file", function(){
          var config = new Configurator('.');
          var publisherZenDesk = new PublisherZenDesk(config, {}, options);

          spies.fs.readFile.andCallFake(function(a, b, callback) {
             callback("a fatal error occured");
          });

          publisherZenDesk.createArticle(function(err, article){
              expect(err).toBe("a fatal error occured");
          });

        });

        it("should return a JSON object with an article pattern", function() {

            var config = new Configurator('.');
            var publisherZenDesk = new PublisherZenDesk(config, {}, options);

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
