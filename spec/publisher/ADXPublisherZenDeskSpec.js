describe("ADXPublisherZenDesk", function() {
    var fs					= require('fs'),
        spies				= {},
        sectionLists = [
            {
                name: "a_section",
                id: 40
            },
            {
                name: "section_found",
                id: 60
            }
        ],
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
        request             = require('request'),
        fakeClient          = {
            articles : {
                create : function (id, jsonArticle, cb) {
                    cb(null, null, {
                        id : 12,
                        body : 'something'
                    });
                },
                listBySection : function (id, cb) {
                    cb(null, null, []);
                },
                delete : function (id, cb) {
                    cb(null);
                }
            },
            translations : {
                updateForArticle : function (a, b, c, cb) {
                    cb(null);
                }
            },
            sections : {
                list : function (cb){
                    cb(null, null, sectionLists);
                }
            }
        };

    function runSync(fn) {
        var wasCalled = false;
        runs(function () {
            fn(function () {
                wasCalled = true;
            });
        });
        waitsFor(function () {
            return wasCalled;
        });
    }

    beforeEach(function() {
        spies.configurator = {
            get  : spyOn(Configurator.prototype, 'get')
        };
        spies.configurator.get.andReturn({
            info : {
                name : 'test-adx',
                constraints : {}
            },
            properties : [{
                id : 'something',
                name : 'something'
            }]
        });
        spies.fs = {
            readFile : spyOn(fs, 'readFile'),
            stat     : spyOn(fs, 'stat')
         };
        spies.fs.stat.andCallFake(function (p, cb) {
            cb(null, {
                isFile : function () {
                    return true;
                }
            });
        });
        spies.fs.readFile.andCallFake(function (p, o, cb) {
            cb(null, 'a text')
        });
        spies.zendesk = {
            createClient : spyOn(zenDesk, 'createClient')
        };
        spies.zendesk.createClient.andReturn(fakeClient);
        spies.request = {
            post : spyOn(request, 'post')
        };
        spies.request.post.andCallFake(function (obj, cb) {
            cb(null, null, JSON.stringify({
                article_attachment : {
                    id : 'an id',
                    file_name : 'a file_name'
                }
            }));
        });
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

        it('should instantiate the zendesk#configurator when everyting is ok', function () {
            var config = new Configurator('.');

            var publisherZenDesk = new PublisherZenDesk(config, {}, {
                username          : 'zendesk@askia.com',
                password          : 'secret',
                remoteUri	      : 'https://uri',
                section_title     : 'a section title'
            });

            expect(publisherZenDesk.configurator).toBe(config);
        });

        it("should instantiate the zendesk with the right options", function() {

            var config = new Configurator('.');
            var publisherZenDesk = new PublisherZenDesk(config, {}, {
                username          : 'zendesk@askia.com',
                password          : 'secret',
                remoteUri	      : 'https://uri',
                section_title     : 'a section title'
            });

            expect(publisherZenDesk.options).toEqual({
                username          : 'zendesk@askia.com',
                password          : 'secret',
                remoteUri	      : 'https://uri/api/v2/help_center',
                section_title     : 'a section title'
            });
        });

        it("should instantiate the zendesk#client when everything is ok", function() {
            var config = new Configurator('.');
            var publisherZenDesk = new PublisherZenDesk(config, {}, {
                username          : 'zendesk@askia.com',
                password          : 'secret',
                remoteUri	      : 'https://uri',
                section_title     : 'a section title'
            });

            expect(publisherZenDesk.client).toBe(fakeClient);
        });

    });

    describe("#publish", function() {

        it("should output an error when the section is not found", function() {
            var config = new Configurator('.');
            var publisherZenDesk = new PublisherZenDesk(config, {}, {
                username	:	'zendesk@askia.com',
                remoteUri	:	'https://uri',
                password    :   'mdp',
                promoted    :    false,
                comments_disabled : false,
                section_title : 'an unexisting section'
            });

            runSync(function (done) {
                publisherZenDesk.publish(function(err) {
                    expect(err).not.toBe(null);
                    done();
                });
            });
        });

        it("should output an error when the .adc file is missing in " + common.ADC_PATH, function() {
            var config = new Configurator('.');
            var publisherZenDesk = new PublisherZenDesk(config, {}, options);
            spies.fs.stat.andCallFake(function (p, cb) {
                if (/test-adx\.adc$/.test(p)) {
                    cb(new Error('something wrong'));
                    return;
                }
                cb(null, {
                    isFile : function () {
                        return true;
                    }
                });
            });

            runSync(function (done) {
                publisherZenDesk.publish(function(err) {
                    expect(err).toBe(errMsg.badNumberOfADCFiles);
                    done();
                });
            });
        });

        it("should output an error when it could not read the article template", function () {
            var config = new Configurator('.');
            var error = new Error('An error');
            var publisherZenDesk = new PublisherZenDesk(config, {}, options);
            spies.fs.readFile.andCallFake(function (p, o, cb) {
                cb(error);
            });

            runSync(function (done) {
                publisherZenDesk.publish(function(err) {
                    expect(err).toBe(error);
                    done();
                });
            });
        });
        
        it("should output an error when it could not retrieve the list of article within the section", function () {
            var config = new Configurator('.');
            var error = new Error('An error');
            var publisherZenDesk = new PublisherZenDesk(config, {}, options);
            spyOn(fakeClient.articles, "listBySection").andCallFake(function (id, cb) {
                cb(error);
            });

            runSync(function (done) {
                publisherZenDesk.publish(function(err) {
                    expect(err).toBe(error);
                    done();
                });
            });
        });
        
        it("should output an error when it found duplicate article title", function () {
            var config = new Configurator('.');
            var publisherZenDesk = new PublisherZenDesk(config, {}, options);
            spyOn(fakeClient.articles, "listBySection").andCallFake(function (id, cb) {
                cb(null, null, [
                    {id : 1, name : "test-adx"},
                    {id : 2, name : "test-adx"}
                ]);
            });

            runSync(function (done) {
                publisherZenDesk.publish(function(err) {
                    expect(err).toBe(errMsg.tooManyArticlesExisting);
                    done();
                });
            });
        });
        
        it("should delete the article when it found one with the same name", function () {
            var config = new Configurator('.');
            var publisherZenDesk = new PublisherZenDesk(config, {}, options);
            spyOn(fakeClient.articles, "listBySection").andCallFake(function (id, cb) {
                cb(null, null, [
                    {id : 1, name : "test-adx"}
                ]);
            });

            runSync(function (done) {
                var deleteMock = spyOn(fakeClient.articles, "delete");
                var id;
                deleteMock.andCallFake(function (i) {
                    id = i;
                });
                publisherZenDesk.publish(function() {});
                expect(deleteMock).toHaveBeenCalled();
                expect(id).toBe(1);
                done();
            });
        });
        
        it("should not delete the article when it not found", function () {
            var config = new Configurator('.');
            var publisherZenDesk = new PublisherZenDesk(config, {}, options);
            
            runSync(function (done) {
                var deleteMock = spyOn(fakeClient.articles, "delete");
                publisherZenDesk.publish(function() {});
                expect(deleteMock).not.toHaveBeenCalled();
                done();
            });
        });
    });

    return;

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
        
        it("should output an error when the upload failed", function() {
            spies.createReadStream = spyOn(fs, 'createReadStream').andReturn('');
            spies.post = spyOn(request, "post").andCallFake(function(obj, cb){
                cb('a fatal error !');
            });
            publisherZenDesk.uploadAvailableFiles(['k.adc'], 86, function(err) {
                expect(err).toBe('a fatal error !'); 
            });
        });
        
        it("should call the callback when all the files have been uploaded", function() {
            spies.post = spyOn(request, "post").andCallFake(function(obj, cb){
                cb(null, null, "{}");
            });
            spies.parse = spyOn(JSON, 'parse').andReturn({article_attachment:{id:56}});
            spies.match = spyOn(String.prototype, 'match').andReturn('');
            spies.createReadStream = spyOn(fs, 'createReadStream').andReturn('');
            publisherZenDesk.uploadAvailableFiles(['file.adc', 'popo.qex'], 42, function(err, attachmentsIDs) {
                expect({err: err, attachmentsIDs: attachmentsIDs}).toEqual({
                    err: null,
                    attachmentsIDs: {
                        undefinedID : 56,
                        undefinedName : undefined
                    }
                });
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
            spies.delete = spyOn(publisherZenDesk.client.articles, "delete").andCallFake(function(section_id, cb) {
                cb(null); 
            });
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
                cb(null, null, [{id: 4, name: 'amazing'}]);
            });
            spies.delete = spyOn(publisherZenDesk.client.articles, "delete").andCallFake(function(id){});
            publisherZenDesk.deleteArticle("an article", 86, function(err){
                expect(spies.delete).not.toHaveBeenCalled();
            });
        });

        it("should call the the callback when article has been deleted", function () {
            spies.listBySection = spyOn(publisherZenDesk.client.articles, "listBySection").andCallFake(function(section_id, cb){
                cb(null, null, [{id: 5, name: 'amazing'}]);
            });
            spies.delete = spyOn(publisherZenDesk.client.articles, "delete").andCallFake(function(section_id, cb) {
                cb(null); 
            });
            publisherZenDesk.deleteArticle("amazing", 86, function(err) {
                expect(err).toEqual(null);
            });
        });

        it("should call the the callback when article does not exist", function () {
            spies.listBySection = spyOn(publisherZenDesk.client.articles, "listBySection").andCallFake(function(section_id, cb){
                cb(null, null, [{id: 5, name: 'amazing'}]);
            });
            
            publisherZenDesk.deleteArticle("an article", 86, function(err) {
                expect(err).toEqual(null);
            });
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
            
            spies.md = spyOn(PublisherZenDesk.prototype, "mdNotesToHtml").andReturn('notes');
            spies.propertiesToHTML = spyOn(PublisherZenDesk.prototype, "propertiesToHTML").andReturn('properties');
            spies.constraintsToSentence = spyOn(PublisherZenDesk.prototype, "constraintsToSentence").andReturn('sentence');
            
            spies.evalTemplate = spyOn(common, 'evalTemplate').andReturn('the-body');

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
